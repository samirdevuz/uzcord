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

export function seal(session: Session): string {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${body}.${signature(body)}`;
}

export function unseal(token: string | undefined): Session | null {
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
    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Session;
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
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
