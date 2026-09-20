/**
 * V1 (SQLite) ma'lumotlarini V2 (Supabase) ga ko'chiradi.
 *
 *   npm run migrate:sqlite
 *
 * Eski baza fayli standart holatda ./data/uzcord.db dan o'qiladi.
 * Boshqa joyda bo'lsa: SQLITE_PATH=./data/eski.db npm run migrate:sqlite
 *
 * Skript qayta-qayta ishlatilishi mumkin — mavjud yozuvlar yangilanadi,
 * takrorlanmaydi (upsert).
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { supabase } from '../src/db/supabase';
import { createLogger } from '../src/core/logger';

const log = createLogger('migrate');

const sqlitePath = path.resolve(
  process.cwd(),
  process.env.SQLITE_PATH ?? './data/uzcord.db'
);

function parseJsonList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseModules(raw: unknown): Record<string, boolean> {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') return parsed as Record<string, boolean>;
    } catch {
      /* e'tiborsiz */
    }
  }
  return {};
}

const toIso = (ms: unknown): string =>
  new Date(typeof ms === 'number' && ms > 0 ? ms : Date.now()).toISOString();

const bool = (value: unknown): boolean => value === 1 || value === true;

async function push(table: string, rows: unknown[], onConflict?: string): Promise<void> {
  if (rows.length === 0) {
    log.info(`${table}: ko'chiriladigan yozuv yo'q`);
    return;
  }
  // 500 tadan bo'lib yuboramiz — katta so'rovlar rad etilmasligi uchun
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const query = supabase.from(table).upsert(chunk as never, onConflict ? { onConflict } : undefined);
    const { error } = await query;
    if (error) {
      log.error(`${table} ko'chirilmadi: ${error.message}`);
      return;
    }
  }
  log.info(`${table}: ${rows.length} ta yozuv ko'chirildi`);
}

async function main(): Promise<void> {
  if (!fs.existsSync(sqlitePath)) {
    log.error(`SQLite fayli topilmadi: ${sqlitePath}`);
    log.info("Agar V1 ma'lumotlari kerak bo'lmasa, bu qadamni o'tkazib yuboring.");
    process.exit(1);
  }

  const db = new Database(sqlitePath, { readonly: true });
  const all = <T>(sql: string): T[] => db.prepare(sql).all() as T[];

  log.info(`Manba: ${sqlitePath}`);

  // 1) Serverlar — boshqa jadvallar shularga bog'langan, birinchi bo'lishi shart
  const guilds = all<Record<string, unknown>>('SELECT * FROM guilds');
  await push(
    'guilds',
    guilds.map((row) => ({
      guild_id: String(row.guild_id),
      locale: row.locale ?? 'uz',
      mod_log_channel_id: row.mod_log_channel_id ?? null,
      message_log_channel_id: row.message_log_channel_id ?? null,
      member_log_channel_id: row.member_log_channel_id ?? null,
      server_log_channel_id: row.server_log_channel_id ?? null,
      voice_log_channel_id: row.voice_log_channel_id ?? null,
      welcome_channel_id: row.welcome_channel_id ?? null,
      welcome_message: row.welcome_message ?? null,
      goodbye_channel_id: row.goodbye_channel_id ?? null,
      goodbye_message: row.goodbye_message ?? null,
      autorole_id: row.autorole_id ?? null,
      dm_on_punish: bool(row.dm_on_punish),
      modules: parseModules(row.modules),
      created_at: toIso(row.created_at),
    })),
    'guild_id'
  );

  // 2) Moderatsiya tarixi
  const cases = all<Record<string, unknown>>('SELECT * FROM mod_cases');
  await push(
    'mod_cases',
    cases.map((row) => ({
      guild_id: String(row.guild_id),
      case_number: row.case_number,
      type: row.type,
      user_id: String(row.user_id),
      user_tag: row.user_tag ?? null,
      moderator_id: String(row.moderator_id),
      moderator_tag: row.moderator_tag ?? null,
      reason: row.reason ?? null,
      duration_ms: row.duration_ms ?? null,
      active: bool(row.active),
      created_at: toIso(row.created_at),
    })),
    'guild_id,case_number'
  );

  // 3) Vaqtinchalik jazolar
  const temps = all<Record<string, unknown>>('SELECT * FROM temp_actions');
  await push(
    'temp_actions',
    temps.map((row) => ({
      guild_id: String(row.guild_id),
      user_id: String(row.user_id),
      type: row.type,
      case_number: row.case_number ?? null,
      expires_at: toIso(row.expires_at),
      created_at: toIso(row.created_at),
    })),
    'guild_id,user_id,type'
  );

  // 4) Eskalatsiya qoidalari
  const escalations = all<Record<string, unknown>>('SELECT * FROM escalations');
  await push(
    'escalations',
    escalations.map((row) => ({
      guild_id: String(row.guild_id),
      warn_count: row.warn_count,
      action: row.action,
      duration_ms: row.duration_ms ?? null,
    })),
    'guild_id,warn_count'
  );

  // 5) AutoMod
  const automod = all<Record<string, unknown>>('SELECT * FROM automod_settings');
  await push(
    'automod_settings',
    automod.map((row) => ({
      guild_id: String(row.guild_id),
      enabled: bool(row.enabled),
      anti_spam: bool(row.anti_spam),
      spam_limit: row.spam_limit,
      spam_window_ms: row.spam_window_ms,
      anti_duplicate: bool(row.anti_duplicate),
      anti_invite: bool(row.anti_invite),
      anti_link: bool(row.anti_link),
      anti_mention: bool(row.anti_mention),
      mention_limit: row.mention_limit,
      anti_caps: bool(row.anti_caps),
      caps_percent: row.caps_percent,
      anti_emoji: bool(row.anti_emoji),
      emoji_limit: row.emoji_limit,
      word_filter: bool(row.word_filter),
      anti_raid: bool(row.anti_raid),
      raid_join_limit: row.raid_join_limit,
      raid_window_ms: row.raid_window_ms,
      min_account_age_days: row.min_account_age_days,
      punishment: row.punishment,
      punishment_ms: row.punishment_ms,
      ignored_channels: parseJsonList(row.ignored_channels),
      ignored_roles: parseJsonList(row.ignored_roles),
      allowed_domains: parseJsonList(row.allowed_domains),
    })),
    'guild_id'
  );

  // 6) Taqiqlangan so'zlar
  const words = all<Record<string, unknown>>('SELECT * FROM filtered_words');
  await push(
    'filtered_words',
    words.map((row) => ({ guild_id: String(row.guild_id), word: row.word })),
    'guild_id,word'
  );

  // 7) Tugmali rollar
  const buttons = all<Record<string, unknown>>('SELECT * FROM button_roles');
  await push(
    'button_roles',
    buttons.map((row) => ({
      guild_id: String(row.guild_id),
      channel_id: String(row.channel_id),
      message_id: String(row.message_id),
      role_id: String(row.role_id),
      label: row.label,
      emoji: row.emoji ?? null,
    })),
    'message_id,role_id'
  );

  db.close();
  log.info("Ko'chirish tugadi. Eski .db faylini zaxira sifatida saqlab qo'ying.");
}

main().catch((error) => {
  log.error("Ko'chirishda xatolik:", error);
  process.exit(1);
});
