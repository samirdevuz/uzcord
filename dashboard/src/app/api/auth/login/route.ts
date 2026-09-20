import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authorizeUrl } from '@/lib/discord';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export function GET() {
  // CSRF himoyasi: tasodifiy state cookie'ga yoziladi va callback'da solishtiriladi
  const state = randomBytes(24).toString('base64url');

  const response = NextResponse.redirect(authorizeUrl(state));
  response.cookies.set('uzcord_oauth_state', state, {
    httpOnly: true,
    secure: env.appUrl.startsWith('https://'),
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 daqiqa
  });
  return response;
}
