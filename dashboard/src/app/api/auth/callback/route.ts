import { NextResponse, type NextRequest } from 'next/server';
import { exchangeCode, fetchManageableGuilds, fetchUser } from '@/lib/discord';
import { env } from '@/lib/env';
import { cookieOptions, seal, sessionLifetimeMs, SESSION_COOKIE, verifyOAuthState } from '@/lib/session';

export const dynamic = 'force-dynamic';

function fail(reason: string): NextResponse {
  return NextResponse.redirect(`${env.appUrl}/?error=${encodeURIComponent(reason)}`);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (request.nextUrl.searchParams.get('error')) return fail('bekor-qilindi');
  if (!code) return fail('kod-yoq');
  if (!verifyOAuthState(state)) return fail('state-mos-emas');

  const accessToken = await exchangeCode(code);
  if (!accessToken) return fail('token-olinmadi');

  const [user, guilds] = await Promise.all([
    fetchUser(accessToken),
    fetchManageableGuilds(accessToken),
  ]);

  if (!user) return fail('foydalanuvchi-topilmadi');

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
