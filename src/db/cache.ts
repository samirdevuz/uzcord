import { config } from '../core/config';
import { createLogger } from '../core/logger';
import { supabase, toMs, unwrapList } from './supabase';
import type { AutoModSettings, GuildSettings } from './types';

const log = createLogger('cache');

/**
 * Issiq ma'lumotlar keshi.
 *
 * AutoMod har bir xabarda server sozlamalarini o'qiydi — agar har safar
 * Supabase ga so'rov ketsa, bot sezilarli sekinlashadi. Shuning uchun
 * server sozlamalari, AutoMod sozlamalari va taqiqlangan so'zlar
 * xotirada saqlanadi va davriy ravishda yangilanadi.
 *
 * Dashboard orqali kiritilgan o'zgarish botga eng ko'pi bilan
 * CACHE_REFRESH_MS ichida yetib boradi.
 */
const guildCache = new Map<string, GuildSettings>();
const autoModCache = new Map<string, AutoModSettings>();
const wordCache = new Map<string, string[]>();

let refreshTimer: NodeJS.Timeout | null = null;

// ── Standart qiymatlar (baza defaultlari bilan bir xil) ────────────────────

export function defaultSettings(guildId = '0'): GuildSettings {
  return {
    guild_id: guildId,
    name: null,
    icon: null,
    member_count: null,
    locale: config.defaultLocale,
    mod_log_channel_id: null,
    message_log_channel_id: null,
    member_log_channel_id: null,
    server_log_channel_id: null,
    voice_log_channel_id: null,
    welcome_channel_id: null,
    welcome_message: null,
    goodbye_channel_id: null,
    goodbye_message: null,
    autorole_id: null,
    dm_on_punish: true,
    modules: {},
    bot_present: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
}

export function defaultAutoMod(guildId = '0'): AutoModSettings {
  return {
    guild_id: guildId,
    enabled: false,
    anti_spam: true,
    spam_limit: 5,
    spam_window_ms: 5000,
    anti_duplicate: true,
    anti_invite: true,
    anti_link: false,
    anti_mention: true,
    mention_limit: 5,
    anti_caps: true,
    caps_percent: 70,
    anti_emoji: false,
    emoji_limit: 10,
    word_filter: true,
    anti_raid: true,
    raid_join_limit: 8,
    raid_window_ms: 15000,
    min_account_age_days: 0,
    punishment: 'warn',
    punishment_ms: 600000,
    ignored_channels: [],
    ignored_roles: [],
    allowed_domains: [],
  };
}

// ── Qatorlarni bot tiplariga aylantirish ──────────────────────────────────

function asList(value: unknown): string[] {
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

export function mapGuild(row: Record<string, unknown>): GuildSettings {
  const base = defaultSettings(String(row.guild_id));
  return {
    ...base,
    ...(row as unknown as GuildSettings),
    modules:
      row.modules && typeof row.modules === 'object'
        ? (row.modules as Record<string, boolean>)
        : {},
    created_at: toMs(row.created_at as string),
    updated_at: toMs(row.updated_at as string),
  };
}

export function mapAutoMod(row: Record<string, unknown>): AutoModSettings {
  const base = defaultAutoMod(String(row.guild_id));
  return {
    ...base,
    ...(row as unknown as AutoModSettings),
    ignored_channels: asList(row.ignored_channels),
    ignored_roles: asList(row.ignored_roles),
    allowed_domains: asList(row.allowed_domains),
  };
}

// ── Keshga kirish ─────────────────────────────────────────────────────────

export function cachedGuild(guildId: string): GuildSettings | undefined {
  return guildCache.get(guildId);
}

export function putGuild(settings: GuildSettings): void {
  guildCache.set(settings.guild_id, settings);
}

export function cachedAutoMod(guildId: string): AutoModSettings | undefined {
  return autoModCache.get(guildId);
}

export function putAutoMod(settings: AutoModSettings): void {
  autoModCache.set(settings.guild_id, settings);
}

export function cachedWords(guildId: string): string[] {
  return wordCache.get(guildId) ?? [];
}

export function putWords(guildId: string, list: string[]): void {
  wordCache.set(guildId, list);
}

export function allCachedGuilds(): GuildSettings[] {
  return [...guildCache.values()];
}

// ── Yuklash va yangilash ──────────────────────────────────────────────────

/** Bazadagi hamma narsani keshga yuklaydi. */
export async function hydrate(): Promise<void> {
  const guildRows = unwrapList(
    await supabase.from('guilds').select('*'),
    'guilds yuklash'
  ) as Record<string, unknown>[];
  guildCache.clear();
  for (const row of guildRows) putGuild(mapGuild(row));

  const autoModRows = unwrapList(
    await supabase.from('automod_settings').select('*'),
    'automod_settings yuklash'
  ) as Record<string, unknown>[];
  autoModCache.clear();
  for (const row of autoModRows) putAutoMod(mapAutoMod(row));

  const wordRows = unwrapList(
    await supabase.from('filtered_words').select('guild_id, word'),
    'filtered_words yuklash'
  ) as { guild_id: string; word: string }[];
  wordCache.clear();
  for (const row of wordRows) {
    const list = wordCache.get(row.guild_id) ?? [];
    list.push(row.word);
    wordCache.set(row.guild_id, list);
  }

  log.debug(
    `Kesh yangilandi: ${guildCache.size} server, ${autoModCache.size} automod, ` +
      `${wordRows.length} so'z`
  );
}

/** Davriy yangilashni boshlaydi. */
export function startCacheRefresh(): void {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    void hydrate().catch((error) => log.warn('Keshni yangilab bo\'lmadi:', error));
  }, config.cacheRefreshMs);
  refreshTimer.unref();
  log.info(`Kesh har ${config.cacheRefreshMs / 1000}s da yangilanadi.`);
}

export function stopCacheRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
