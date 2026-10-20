import { supabase, unwrap, unwrapList } from './supabase';
import { createLogger } from '../core/logger';

const log = createLogger('db:giveaways');

export interface Giveaway {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  prize: string;
  description: string | null;
  winner_count: number;
  host_id: string;
  required_role_id: string | null;
  required_level: number | null;
  ends_at: string;
  ended: boolean;
  winners: string[];
  created_at: string;
}

export async function createGiveaway(
  giveaway: Omit<Giveaway, 'id' | 'ended' | 'winners' | 'created_at'>
): Promise<Giveaway | null> {
  return unwrap(
    await supabase.from('giveaways').insert(giveaway).select().single(),
    'createGiveaway'
  ) as Giveaway | null;
}

export async function getGiveawayByMessage(messageId: string): Promise<Giveaway | null> {
  const { data } = await supabase
    .from('giveaways')
    .select('*')
    .eq('message_id', messageId)
    .maybeSingle();

  return data ? ({ ...data, winners: Array.isArray(data.winners) ? data.winners : [] } as Giveaway) : null;
}

export async function getDueGiveaways(): Promise<Giveaway[]> {
  return unwrapList(
    await supabase
      .from('giveaways')
      .select('*')
      .eq('ended', false)
      .lte('ends_at', new Date().toISOString()),
    'getDueGiveaways'
  ) as Giveaway[];
}

export async function addGiveawayEntry(giveawayId: number, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('giveaway_entries')
    .insert({ giveaway_id: giveawayId, user_id: userId });

  if (error) {
    if (!error.message.includes('duplicate')) {
      log.error(`addGiveawayEntry: ${error.message}`);
    }
    return false;
  }
  return true;
}

export async function getGiveawayEntries(giveawayId: number): Promise<string[]> {
  const rows = unwrapList(
    await supabase
      .from('giveaway_entries')
      .select('user_id')
      .eq('giveaway_id', giveawayId),
    'getGiveawayEntries'
  ) as { user_id: string }[];

  return rows.map((r) => r.user_id);
}

export async function removeGiveawayEntry(giveawayId: number, userId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('giveaway_entries')
    .delete({ count: 'exact' })
    .eq('giveaway_id', giveawayId)
    .eq('user_id', userId);
  if (error) {
    log.error(`removeGiveawayEntry: ${error.message}`);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function countGiveawayEntries(giveawayId: number): Promise<number> {
  const { count, error } = await supabase
    .from('giveaway_entries')
    .select('user_id', { count: 'exact', head: true })
    .eq('giveaway_id', giveawayId);
  if (error) {
    log.error(`countGiveawayEntries: ${error.message}`);
    return 0;
  }
  return count ?? 0;
}

/** Faqat hali yakunlanmagan konkursni yakunlaydi — ikki marta yakunlanishdan himoya. */
export async function claimGiveawayEnd(id: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('giveaways')
    .update({ ended: true })
    .eq('id', id)
    .eq('ended', false)
    .select('id');
  if (error) {
    log.error(`claimGiveawayEnd: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export async function setGiveawayWinners(id: number, winners: string[]): Promise<void> {
  const { error } = await supabase.from('giveaways').update({ winners }).eq('id', id);
  if (error) log.error(`setGiveawayWinners: ${error.message}`);
}

export async function endGiveaway(id: number, winners: string[]): Promise<void> {
  const { error } = await supabase
    .from('giveaways')
    .update({ ended: true, winners })
    .eq('id', id);

  if (error) log.error(`endGiveaway: ${error.message}`);
}
