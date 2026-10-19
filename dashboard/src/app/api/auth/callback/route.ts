import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode, fetchManageableGuilds, fetchUser, type TokenResult } from '@/lib/discord';
import { env } from '@/lib/env';
import { cookieOptions, seal, sessionLifetimeMs, SESSION_COOKIE, verifyOAuthState } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Token xatosi sababi -> bosh sahifadagi ?error= kodi (matnlari src/app/page.tsx da). */
const TOKEN_ERRORS: Record<Extract<TokenResult, { ok: false }>['reason'], string> = {
  invalid_client: 'discord-sozlama',
  redirect: 'redirect-mos-emas',
  expired: 'kod-eskirgan',
  rate_limited: 'discord-limit',
  network: 'discord-tarmoq',
  unknown: 'token-olinmadi',
};

function fail(reason: string, status?: number): NextResponse {
  const url = new URL(`${env.appUrl}/`);
  url.searchParams.set('error', reason);
  if (status) url.searchParams.set('holat', String(status));
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (request.nextUrl.searchParams.get('error')) return fail('bekor-qilindi');
  if (!code) return fail('kod-yoq');
  if (!verifyOAuthState(state)) return fail('state-mos-emas');

  const token = await exchangeCode(code);
  if (!token.ok) return fail(TOKEN_ERRORS[token.reason], token.status || undefined);

  const [user, guilds] = await Promise.all([
    fetchUser(token.accessToken),
    fetchManageableGuilds(token.accessToken),
  ]);

  if (!user) return fail('foydalanuvchi-topilmadi');
  if (!guilds) return fail('serverlar-olinmadi');

  const response = NextResponse.redirect(`${env.appUrl}/dashboard`);

  response.cookies.set(
    SESSION_COOKIE,
    seal({
      userId: user.id,
      username: user.global_name ?? user.username,
      avatar: user.avatar,
      guilds,
      exp: Date.now() + sessionLifetimeMs(),
    }),
    cookieOptions()
  );

  return response;
}
