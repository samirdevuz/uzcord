import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../core/config';
import { createLogger } from '../core/logger';

const log = createLogger('supabase');

/**
 * Bot server tomonida ishlaydi, shuning uchun service_role kalitidan
 * foydalanadi — u RLS ni chetlab o'tadi. Bu kalit HECH QACHON
 * brauzerga yoki foydalanuvchiga ko'rinmasligi kerak.
 */
export const supabase: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-client-info': 'uzcord-bot' } },
  }
);

interface Result<T> {
  data: T | null;
  error: { message: string } | null;
}

/** So'rov natijasini tekshiradi: xato bo'lsa logga yozib null qaytaradi. */
export function unwrap<T>(result: Result<T>, what: string): T | null {
  if (result.error) {
    log.error(`${what} — ${result.error.message}`);
    return null;
  }
  return result.data;
}

/** Ro'yxat qaytaradigan so'rovlar uchun: xato bo'lsa bo'sh massiv. */
export function unwrapList<T>(result: Result<T[]>, what: string): T[] {
  return unwrap(result, what) ?? [];
}

/** Postgres timestamptz (ISO matn) -> millisekund. */
export function toMs(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0;
}

/** Millisekund -> Postgres timestamptz uchun ISO matn. */
export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

/** Ulanishni tekshiradi. Bot ishga tushganda bir marta chaqiriladi. */
export async function checkConnection(): Promise<boolean> {
  const { error } = await supabase.from('guilds').select('guild_id').limit(1);
  if (error) {
    log.error(`Supabase ga ulanib bo'lmadi: ${error.message}`);
    return false;
  }
  log.info(`Supabase ulandi: ${config.supabaseUrl}`);
  return true;
}
