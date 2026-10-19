import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * service_role kaliti RLS ni chetlab o'tadi — shuning uchun bu klient
 * FAQAT server tomonida (server component, server action, route handler)
 * ishlatiladi. Ruxsat tekshiruvi `guard.ts` da qo'lda bajariladi.
 */
export const db: SupabaseClient = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'x-client-info': 'uzcord-dashboard' } },
});

/**
 * Supabase xatosini foydalanuvchiga ko'rsatsa bo'ladigan qisqa matnga aylantiradi.
 *
 * Loyiha pauzada yoki qayta ishga tushayotganda Cloudflare butun HTML sahifa
 * qaytaradi (masalan "521: Web server is down") — uni ekranga yoki URL'ga
 * chiqarib bo'lmaydi. To'liq xato server logiga yoziladi.
 */
export function dbErrorMessage(error: { message?: string; code?: string } | null | undefined): string {
  const raw = (error?.message ?? '').trim();
  console.error('[supabase]', error?.code ?? '', raw.slice(0, 500));

  if (/<!doctype html|<html/i.test(raw)) {
    const status = raw.match(/\b(5\d{2})\b/)?.[1];
    return (
      `Baza vaqtincha javob bermayapti${status ? ` (HTTP ${status})` : ''}. ` +
      'Supabase loyihasi pauzada yoki qayta ishga tushmoqda — bir-ikki daqiqadan keyin sahifani yangilang.'
    );
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(raw)) {
    return 'Bazaga ulanib bo‘lmadi. SUPABASE_URL ni va Supabase loyihasi faolligini tekshiring.';
  }
  if (!raw) return 'Noma‘lum baza xatosi.';
  return raw.replace(/\s+/g, ' ').slice(0, 200);
}

export function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}
