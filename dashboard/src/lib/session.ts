import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { env } from './env';

export const SESSION_COOKIE = 'uzcord_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 kun

export interface SessionGuild {
  id: string;
  name: string;
  icon: string | null;
}

export interface Session {
  userId: string;
  username: string;
  avatar: string | null;
  /** Foydalanuvchi boshqara oladigan serverlar (MANAGE_GUILD ruxsati bor). */
  guilds: SessionGuild[];
  exp: number;
}

function signature(body: string): string {
  return createHmac('sha256', env.sessionSecret).update(body).digest('base64url');
}

/**
 * Umumiy: istalgan JSON obyektni imzolab, tekshiriladigan tokenga aylantiradi.
 * Cookie yoki bazaga bog'liq emas — shuning uchun brauzerning "redirect vaqtida
 * cookie yozishni bloklash" (bounce tracking protection) xavfsizlik choralariga
 * ta'sir qilmaydi. OAuth `state` parametri va sessiya cookie'si shu asosda ishlaydi.
 */
function signToken<T extends { exp: number }>(payload: T): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signature(body)}`;
}

function verifyToken<T extends { exp: number }>(token: string | null | undefined): T | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, provided] = parts;
  const expected = signature(body);

  // Vaqt bo'yicha xavfsiz solishtirish
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function seal(session: Session): string {
  return signToken(session);
}

export function unseal(token: string | undefined): Session | null {
  return verifyToken<Session>(token);
}

// ── OAuth "state" — CSRF himoyasi, cookie'siz ───────────────────────────────
// Ilgari `state` tasodifiy qiymat sifatida cookie'ga yozilib, Discord qaytargan
// qiymat bilan solishtirilardi. Ba'zi brauzerlar (Safari ITP, Firefox Strict,
// Brave Shields) redirect javobida yoziladigan cookie'larni kuzatuvga qarshi
// himoya sifatida bloklaydi — natijada "state-mos-emas" xatosi chiqadi.
// Endi `state`ning o'zi imzolangan token: cookie umuman kerak emas.
const STATE_TTL_MS = 10 * 60 * 1000; // 10 daqiqa

export function createOAuthState(): string {
  return signToken({ nonce: Math.random().toString(36).slice(2), exp: Date.now() + STATE_TTL_MS });
}

export function verifyOAuthState(state: string | null): boolean {
  return verifyToken<{ nonce: string; exp: number }>(state) !== null;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.appUrl.startsWith('https://'),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}

export function sessionLifetimeMs(): number {
  return MAX_AGE_SECONDS * 1000;
}

/** Joriy sessiyani o'qiydi (server komponentlarda). */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return unseal(store.get(SESSION_COOKIE)?.value);
}
