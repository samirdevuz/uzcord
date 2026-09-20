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
