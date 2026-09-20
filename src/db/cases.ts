import { createLogger } from '../core/logger';
import { supabase, toIso, toMs, unwrap, unwrapList } from './supabase';
import type { ModCase, NewCase, TempAction } from './types';

export type { CaseType, ModCase, NewCase, TempAction } from './types';

const log = createLogger('db:cases');

function mapCase(row: Record<string, unknown>): ModCase {
  return {
    ...(row as unknown as ModCase),
    created_at: toMs(row.created_at as string),
  };
}

/**
 * Yangi case yaratadi. Case raqami Postgres funksiyasi ichida,
 * advisory lock ostida beriladi — poyga holati bo'lmaydi.
 */
export async function createCase(data: NewCase): Promise<ModCase | null> {
  const row = unwrap(
    await supabase.rpc('create_mod_case', {
      p_guild_id: data.guildId,
      p_type: data.type,
      p_user_id: data.userId,
      p_user_tag: data.userTag ?? null,
      p_moderator_id: data.moderatorId,
      p_moderator_tag: data.moderatorTag ?? null,
      p_reason: data.reason ?? null,
      p_duration_ms: data.durationMs ?? null,
    }),
    'createCase'
  ) as Record<string, unknown> | null;

  return row ? mapCase(row) : null;
}

export async function getCase(guildId: string, caseNumber: number): Promise<ModCase | null> {
  const { data, error } = await supabase
    .from('mod_cases')
    .select('*')
    .eq('guild_id', guildId)
    .eq('case_number', caseNumber)
    .maybeSingle();
  if (error) {
    log.error(`getCase: ${error.message}`);
    return null;
  }
  return data ? mapCase(data as Record<string, unknown>) : null;
}

export async function getUserCases(
  guildId: string,
  userId: string,
  limit = 25
): Promise<ModCase[]> {
  const rows = unwrapList(
    await supabase
      .from('mod_cases')
      .select('*')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .order('case_number', { ascending: false })
      .limit(limit),
    'getUserCases'
  ) as Record<string, unknown>[];
  return rows.map(mapCase);
}

export async function getActiveWarnings(guildId: string, userId: string): Promise<ModCase[]> {
  const rows = unwrapList(
    await supabase
      .from('mod_cases')
      .select('*')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .eq('type', 'warn')
      .eq('active', true)
      .order('case_number', { ascending: false }),
    'getActiveWarnings'
  ) as Record<string, unknown>[];
  return rows.map(mapCase);
}

export async function countActiveWarnings(guildId: string, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('mod_cases')
    .select('id', { count: 'exact', head: true })
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .eq('type', 'warn')
    .eq('active', true);
  if (error) {
    log.error(`countActiveWarnings: ${error.message}`);
    return 0;
  }
  return count ?? 0;
}

export async function deactivateCase(guildId: string, caseNumber: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('mod_cases')
    .update({ active: false })
    .eq('guild_id', guildId)
    .eq('case_number', caseNumber)
    .eq('active', true)
    .select('id');
  if (error) {
    log.error(`deactivateCase: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export async function clearWarnings(guildId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('mod_cases')
    .update({ active: false })
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .eq('type', 'warn')
    .eq('active', true)
    .select('id');
  if (error) {
    log.error(`clearWarnings: ${error.message}`);
    return 0;
  }
  return data?.length ?? 0;
}

export async function updateCaseReason(
  guildId: string,
  caseNumber: number,
  reason: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('mod_cases')
    .update({ reason })
    .eq('guild_id', guildId)
    .eq('case_number', caseNumber)
    .select('id');
  if (error) {
    log.error(`updateCaseReason: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

// ── Vaqtinchalik jazolar ────────────────────────────────────────────────────

function mapTemp(row: Record<string, unknown>): TempAction {
  return {
    ...(row as unknown as TempAction),
    expires_at: toMs(row.expires_at as string),
    created_at: toMs(row.created_at as string),
  };
}

export async function addTempAction(
  guildId: string,
  userId: string,
  type: TempAction['type'],
  expiresAt: number,
  caseNumber: number | null
): Promise<void> {
  const { error } = await supabase.from('temp_actions').upsert(
    {
      guild_id: guildId,
      user_id: userId,
      type,
      case_number: caseNumber,
      expires_at: toIso(expiresAt),
    },
    { onConflict: 'guild_id,user_id,type' }
  );
  if (error) log.error(`addTempAction: ${error.message}`);
}

export async function getExpiredActions(at = Date.now()): Promise<TempAction[]> {
  const rows = unwrapList(
    await supabase.from('temp_actions').select('*').lte('expires_at', toIso(at)),
    'getExpiredActions'
  ) as Record<string, unknown>[];
  return rows.map(mapTemp);
}

export async function removeTempAction(id: number): Promise<void> {
  const { error } = await supabase.from('temp_actions').delete().eq('id', id);
  if (error) log.error(`removeTempAction: ${error.message}`);
}

export async function removeTempActionFor(
  guildId: string,
  userId: string,
  type: string
): Promise<void> {
  const { error } = await supabase
    .from('temp_actions')
    .delete()
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .eq('type', type);
  if (error) log.error(`removeTempActionFor: ${error.message}`);
}
