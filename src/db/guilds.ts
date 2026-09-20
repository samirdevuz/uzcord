import { createLogger } from '../core/logger';
import {
  cachedGuild,
  defaultSettings,
  mapGuild,
  putGuild,
} from './cache';
import { supabase, unwrap, unwrapList } from './supabase';
import { LOG_COLUMNS } from './types';
import type { Escalation, GuildSettings, LogKind, ModuleName } from './types';

export { defaultSettings } from './cache';
export { MODULE_NAMES } from './types';
export { LOG_COLUMNS };
export type { Escalation, GuildSettings, LogKind, ModuleName } from './types';

const log = createLogger('db:guilds');

/**
 * Server sozlamalarini KESHDAN oladi — sinxron va tez.
 * Kesh bo'sh bo'lsa standart qiymatlar qaytadi va yozuv fonda yaratiladi.
 */
export function getSettings(guildId: string): GuildSettings {
  const cached = cachedGuild(guildId);
  if (cached) return cached;

  const fallback = defaultSettings(guildId);
  putGuild(fallback);
  void ensureGuild(guildId);
  return fallback;
}

/** Server yozuvi bazada borligiga ishonch hosil qiladi. */
export async function ensureGuild(
  guildId: string,
  meta?: { name?: string | null; icon?: string | null; memberCount?: number | null }
): Promise<GuildSettings> {
  const payload: Record<string, unknown> = { guild_id: guildId, bot_present: true };
  if (meta?.name !== undefined) payload.name = meta.name;
  if (meta?.icon !== undefined) payload.icon = meta.icon;
  if (meta?.memberCount !== undefined) payload.member_count = meta.memberCount;

  const row = unwrap(
    await supabase.from('guilds').upsert(payload, { onConflict: 'guild_id' }).select().single(),
    `ensureGuild(${guildId})`
  ) as Record<string, unknown> | null;

  if (!row) return getSettings(guildId);

  const settings = mapGuild(row);
  putGuild(settings);
  return settings;
}

/** Sozlamalarni yangilaydi va keshni darhol yangilaydi. */
export async function updateSettings(
  guildId: string,
  patch: Partial<GuildSettings>
): Promise<GuildSettings> {
  const payload = { ...patch, guild_id: guildId };
  delete (payload as Record<string, unknown>).created_at;
  delete (payload as Record<string, unknown>).updated_at;

  const row = unwrap(
    await supabase.from('guilds').upsert(payload, { onConflict: 'guild_id' }).select().single(),
    `updateSettings(${guildId})`
  ) as Record<string, unknown> | null;

  if (!row) {
    // Yozib bo'lmadi — keshni hech bo'lmasa mahalliy yangilaymiz.
    const merged = { ...getSettings(guildId), ...patch };
    putGuild(merged);
    return merged;
  }

  const settings = mapGuild(row);
  putGuild(settings);
  return settings;
}

export async function setLogChannel(
  guildId: string,
  kind: LogKind,
  channelId: string | null
): Promise<void> {
  await updateSettings(guildId, { [LOG_COLUMNS[kind]]: channelId } as Partial<GuildSettings>);
}

/** Modul yoqilganmi? Standart holatda barcha modullar yoqiq. */
export function isModuleEnabled(settings: GuildSettings, name: ModuleName): boolean {
  return settings.modules?.[name] !== false;
}

export async function setModule(
  guildId: string,
  name: ModuleName,
  enabled: boolean
): Promise<void> {
  const settings = getSettings(guildId);
  const modules = { ...(settings.modules ?? {}), [name]: enabled };
  await updateSettings(guildId, { modules });
}

/** Bot serverdan chiqarilganda belgilab qo'yadi (ma'lumotlar o'chirilmaydi). */
export async function markBotLeft(guildId: string): Promise<void> {
  await updateSettings(guildId, { bot_present: false });
}

// ── Ogohlantirish eskalatsiyasi ─────────────────────────────────────────────

export async function getEscalations(guildId: string): Promise<Escalation[]> {
  return unwrapList(
    await supabase
      .from('escalations')
      .select('*')
      .eq('guild_id', guildId)
      .order('warn_count', { ascending: true }),
    `getEscalations(${guildId})`
  ) as Escalation[];
}

export async function setEscalation(
  guildId: string,
  warnCount: number,
  action: Escalation['action'],
  durationMs: number | null
): Promise<void> {
  await ensureGuild(guildId);
  const { error } = await supabase.from('escalations').upsert(
    { guild_id: guildId, warn_count: warnCount, action, duration_ms: durationMs },
    { onConflict: 'guild_id,warn_count' }
  );
  if (error) log.error(`setEscalation: ${error.message}`);
}

export async function removeEscalation(guildId: string, warnCount: number): Promise<boolean> {
  const { error, count } = await supabase
    .from('escalations')
    .delete({ count: 'exact' })
    .eq('guild_id', guildId)
    .eq('warn_count', warnCount);
  if (error) {
    log.error(`removeEscalation: ${error.message}`);
    return false;
  }
  return (count ?? 0) > 0;
}
