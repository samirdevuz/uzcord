import { env } from './env';
import type { SessionGuild } from './session';

const API = 'https://discord.com/api/v10';

/** MANAGE_GUILD = 1 << 5, ADMINISTRATOR = 1 << 3 */
const MANAGE_GUILD = 1n << 5n;
const ADMINISTRATOR = 1n << 3n;

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.discordClientId,
    redirect_uri: `${env.appUrl}/api/auth/callback`,
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'none',
  });
  return `${API}/oauth2/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function exchangeCode(code: string): Promise<string | null> {
  const response = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.discordClientId,
      client_secret: env.discordClientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${env.appUrl}/api/auth/callback`,
    }),
    cache: 'no-store',
  });

  if (!response.ok) return null;
  const data = (await response.json()) as TokenResponse;
  return data.access_token ?? null;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export async function fetchUser(accessToken: string): Promise<DiscordUser | null> {
  const response = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) return null;
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
 */
export async function fetchManageableGuilds(accessToken: string): Promise<SessionGuild[]> {
  const response = await fetch(`${API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) return [];

  const guilds = (await response.json()) as RawGuild[];
  if (!Array.isArray(guilds)) return [];

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
