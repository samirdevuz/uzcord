import { createLogger } from '../core/logger';
import { cachedAutoMod, cachedWords, defaultAutoMod, mapAutoMod, putAutoMod, putWords } from './cache';
import { supabase, unwrap, unwrapList } from './supabase';
import type { AutoModSettings } from './types';

export { TOGGLE_FEATURES } from './types';
export type { AutoModSettings, ToggleFeature } from './types';

const log = createLogger('db:automod');

/** AutoMod sozlamalarini KESHDAN oladi — har bir xabarda chaqiriladi. */
export function getAutoMod(guildId: string): AutoModSettings {
  const cached = cachedAutoMod(guildId);
  if (cached) return cached;

  const fallback = defaultAutoMod(guildId);
  putAutoMod(fallback);
  void ensureAutoMod(guildId);
  return fallback;
}

async function ensureAutoMod(guildId: string): Promise<AutoModSettings> {
  const row = unwrap(
    await supabase
      .from('automod_settings')
      .upsert({ guild_id: guildId }, { onConflict: 'guild_id' })
      .select()
      .single(),
    `ensureAutoMod(${guildId})`
  ) as Record<string, unknown> | null;

  if (!row) return getAutoMod(guildId);
  const settings = mapAutoMod(row);
  putAutoMod(settings);
  return settings;
}

export async function updateAutoMod(
  guildId: string,
  patch: Partial<AutoModSettings>
): Promise<AutoModSettings> {
  const row = unwrap(
    await supabase
      .from('automod_settings')
      .upsert({ ...patch, guild_id: guildId }, { onConflict: 'guild_id' })
      .select()
      .single(),
    `updateAutoMod(${guildId})`
  ) as Record<string, unknown> | null;

  if (!row) {
    const merged = { ...getAutoMod(guildId), ...patch };
    putAutoMod(merged);
    return merged;
  }

  const settings = mapAutoMod(row);
  putAutoMod(settings);
  return settings;
}

/**
 * Moslik uchun: ilgari ro'yxatlar JSON matn sifatida saqlanardi.
 * Endi ular jsonb (massiv) — bu funksiya ikkalasini ham qabul qiladi.
 */
export function parseList(value: string[] | string | null | undefined): string[] {
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

/** Ro'yxatdagi elementni qo'shadi yoki olib tashlaydi. */
export async function toggleInList(
  guildId: string,
  column: 'ignored_channels' | 'ignored_roles' | 'allowed_domains',
  value: string
): Promise<{ list: string[]; added: boolean }> {
  const settings = getAutoMod(guildId);
  const list = parseList(settings[column]);
  const index = list.indexOf(value);
  let added: boolean;
  if (index === -1) {
    list.push(value);
    added = true;
  } else {
    list.splice(index, 1);
    added = false;
  }
  await updateAutoMod(guildId, { [column]: list } as Partial<AutoModSettings>);
  return { list, added };
}

// ── Taqiqlangan so'zlar ─────────────────────────────────────────────────────

/** Keshdan o'qiladi — AutoMod issiq yo'li. */
export function listWords(guildId: string): string[] {
  return cachedWords(guildId);
}

export async function refreshWords(guildId: string): Promise<string[]> {
  const rows = unwrapList(
    await supabase
      .from('filtered_words')
      .select('word')
      .eq('guild_id', guildId)
      .order('word', { ascending: true }),
    `refreshWords(${guildId})`
  ) as { word: string }[];
  const list = rows.map((row) => row.word);
  putWords(guildId, list);
  return list;
}

export async function addWord(guildId: string, word: string): Promise<boolean> {
  const clean = word.trim().toLowerCase();
  if (!clean) return false;
  if (listWords(guildId).includes(clean)) return false;

  const { error } = await supabase
    .from('filtered_words')
    .insert({ guild_id: guildId, word: clean });

  if (error) {
    // 23505 = unique violation (so'z allaqachon bor)
    if (!error.message.includes('duplicate')) log.error(`addWord: ${error.message}`);
    return false;
  }

  await refreshWords(guildId);
  return true;
}

export async function removeWord(guildId: string, word: string): Promise<boolean> {
  const clean = word.trim().toLowerCase();
  const { data, error } = await supabase
    .from('filtered_words')
    .delete()
    .eq('guild_id', guildId)
    .eq('word', clean)
    .select('id');

  if (error) {
    log.error(`removeWord: ${error.message}`);
    return false;
  }

  await refreshWords(guildId);
  return (data?.length ?? 0) > 0;
}
