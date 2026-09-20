import { createLogger } from '../core/logger';
import { hydrate, startCacheRefresh, stopCacheRefresh } from './cache';
import { checkConnection } from './supabase';

const log = createLogger('db');

export { supabase } from './supabase';
export * from './types';

/**
 * Bazani ishga tayyorlaydi: ulanishni tekshiradi, keshni to'ldiradi
 * va davriy yangilashni yoqadi. Bot login qilishdan OLDIN chaqiriladi.
 */
export async function initDatabase(): Promise<void> {
  const ok = await checkConnection();
  if (!ok) {
    throw new Error(
      "Supabase ga ulanib bo'lmadi. .env dagi SUPABASE_URL va " +
        'SUPABASE_SERVICE_ROLE_KEY qiymatlarini tekshiring.'
    );
  }
  await hydrate();
  startCacheRefresh();
  log.info('Baza tayyor.');
}

export function closeDatabase(): void {
  stopCacheRefresh();
  log.info('Baza ulanishi yopildi.');
}
