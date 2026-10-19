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
    .single();

  return data ? (data as Giveaway) : null;
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

export async function endGiveaway(id: number, winners: string[]): Promise<void> {
  const { error } = await supabase
    .from('giveaways')
    .update({ ended: true, winners })
    .eq('id', id);

  if (error) log.error(`endGiveaway: ${error.message}`);
}
