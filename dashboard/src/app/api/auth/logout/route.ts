import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export function GET() {
  const response = NextResponse.redirect(`${env.appUrl}/`);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const POST = GET;
