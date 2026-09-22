import { NextResponse } from 'next/server';
import { authorizeUrl } from '@/lib/discord';
import { createOAuthState } from '@/lib/session';

export const dynamic = 'force-dynamic';

export function GET() {
  // `state` cookie'ga emas, imzolangan token sifatida URL ichida yuboriladi —
  // shuning uchun brauzerning redirect-cookie blokirovkasiga ta'sir qilmaydi.
  // Tafsilot: src/lib/session.ts dagi izoh.
  return NextResponse.redirect(authorizeUrl(createOAuthState()));
}
