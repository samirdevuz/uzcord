import { env } from './env';
import type { SessionGuild } from './session';

const API = 'https://discord.com/api/v10';

/** MANAGE_GUILD = 1 << 5, ADMINISTRATOR = 1 << 3 */
const MANAGE_GUILD = 1n << 5n;
const ADMINISTRATOR = 1n << 3n;

/** 429 javobida shuncha soniyagacha kutib, bir marta qayta urinamiz. */
const MAX_RETRY_WAIT_SECONDS = 3;

export function redirectUri(): string {
  return `${env.appUrl}/api/auth/callback`;
}

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.discordClientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'none',
  });
  return `${API}/oauth2/authorize?${params.toString()}`;
}

/**
 * Discord'ga so'rov yuboradi. 429 (rate limit) kelsa va kutish qisqa bo'lsa,
 * bir marta qayta urinadi. Tarmoq xatosida `null` qaytaradi.
 */
async function discordFetch(url: string, init: RequestInit): Promise<Response | null> {
  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    } catch (error) {
      console.error(`[discord] ${url} so'roviga ulanib bo'lmadi:`, error);
      return null;
    }

    if (response.status !== 429 || attempt > 0) return response;

    const wait = Number(response.headers.get('retry-after') ?? '0');
    if (!(wait > 0 && wait <= MAX_RETRY_WAIT_SECONDS)) return response;
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
  }
}

/** Xato javob matnidan Discord'ning `error` / `error_description` maydonlarini oladi. */
async function readError(response: Response): Promise<{ error: string; description: string }> {
  const text = await response.text().catch(() => '');
  try {
    const json = JSON.parse(text) as { error?: string; error_description?: string; message?: string };
    return { error: json.error ?? '', description: json.error_description ?? json.message ?? '' };
  } catch {
    // Cloudflare bloklaganda JSON emas, HTML qaytadi.
    return { error: '', description: text.replace(/\s+/g, ' ').slice(0, 200) };
  }
}

/**
 * Kodni tokenga almashtirish natijasi. Xato bo'lsa sababi aniq ko'rsatiladi —
 * ilgari hammasi bitta "token olinmadi" xabariga aylanib, sababini topib bo'lmasdi.
 */
export type TokenResult =
  | { ok: true; accessToken: string }
  | {
      ok: false;
      /** invalid_client — ID/secret noto'g'ri; redirect — redirect URI mos emas;
       *  expired — kod eskirgan yoki ishlatilgan; rate_limited — Discord chekladi. */
      reason: 'invalid_client' | 'redirect' | 'expired' | 'rate_limited' | 'network' | 'unknown';
      status: number;
    };

export async function exchangeCode(code: string): Promise<TokenResult> {
  const response = await discordFetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.discordClientId,
      client_secret: env.discordClientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
    }).toString(),
  });

  if (!response) return { ok: false, reason: 'network', status: 0 };

  if (response.ok) {
    const data = (await response.json()) as { access_token?: string };
    if (data.access_token) return { ok: true, accessToken: data.access_token };
    return { ok: false, reason: 'unknown', status: response.status };
  }

  const { error, description } = await readError(response);
  // Secret logga tushmaydi — faqat Discord javobi va ishlatilgan redirect URI.
  console.error(
    `[oauth] Discord kodni rad etdi: HTTP ${response.status} ${error} — ${description} ` +
      `(client_id=${env.discordClientId}, redirect_uri=${redirectUri()})`
  );

  if (response.status === 429) return { ok: false, reason: 'rate_limited', status: 429 };
  if (error === 'invalid_client' || response.status === 401) {
    return { ok: false, reason: 'invalid_client', status: response.status };
  }
  if (error === 'invalid_grant' || error === 'invalid_request') {
    return {
      ok: false,
      reason: /redirect_uri/i.test(description) ? 'redirect' : 'expired',
      status: response.status,
    };
  }
  return { ok: false, reason: 'unknown', status: response.status };
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export async function fetchUser(accessToken: string): Promise<DiscordUser | null> {
  const response = await discordFetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response?.ok) {
    if (response) console.error(`[oauth] /users/@me: HTTP ${response.status}`);
    return null;
  }
  return (await response.json()) as DiscordUser;
}

interface RawGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

/**
 * Foydalanuvchi BOSHQARA OLADIGAN serverlarni qaytaradi.
 * Bu ro'yxat sessiyaga yoziladi va keyin har bir so'rovda ruxsat
 * tekshiruvi uchun ishlatiladi.
 *
 * Xato bo'lsa `null` qaytaradi — bo'sh ro'yxat bilan jimgina kirib qolish
 * foydalanuvchini "serverlarim qayoqqa ketdi?" degan holatga solardi.
 */
export async function fetchManageableGuilds(accessToken: string): Promise<SessionGuild[] | null> {
  const response = await discordFetch(`${API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response?.ok) {
    if (response) console.error(`[oauth] /users/@me/guilds: HTTP ${response.status}`);
    return null;
  }

  const guilds = (await response.json()) as RawGuild[];
  if (!Array.isArray(guilds)) return null;

  return guilds
    .filter((guild) => {
      if (guild.owner) return true;
      let bits: bigint;
      try {
        bits = BigInt(guild.permissions ?? '0');
      } catch {
        return false;
      }
      return (bits & MANAGE_GUILD) === MANAGE_GUILD || (bits & ADMINISTRATOR) === ADMINISTRATOR;
    })
    .map((guild) => ({ id: guild.id, name: guild.name, icon: guild.icon }));
}

export function guildIconUrl(id: string, icon: string | null, size = 128): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${id}/${icon}.${ext}?size=${size}`;
}

export function userAvatarUrl(id: string, avatar: string | null, size = 64): string {
  if (!avatar) {
    const index = (BigInt(id) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  const ext = avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=${size}`;
}
