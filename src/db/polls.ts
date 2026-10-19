import { supabase, unwrap, unwrapList } from './supabase';
import { createLogger } from '../core/logger';

const log = createLogger('db:polls');

export interface PollOption {
  key: string;
  label: string;
}

export interface Poll {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string | null;
  question: string;
  options: PollOption[];
  multi: boolean;
  ends_at: string | null;
  ended: boolean;
  created_by: string | null;
  created_at: string;
}

export interface PollVote {
  poll_id: number;
  user_id: string;
  option_key: string;
  voted_at: string;
}

export async function createPoll(
  poll: Omit<Poll, 'id' | 'ended' | 'created_at'>
): Promise<Poll | null> {
  return unwrap(
    await supabase.from('polls').insert(poll).select().single(),
    'createPoll'
  ) as Poll | null;
}

export async function getPollByMessage(messageId: string): Promise<Poll | null> {
  const { data } = await supabase
    .from('polls')
    .select('*')
    .eq('message_id', messageId)
    .single();

  return data ? (data as Poll) : null;
}

export async function getDuePolls(): Promise<Poll[]> {
  return unwrapList(
    await supabase
      .from('polls')
      .select('*')
      .eq('ended', false)
      .not('ends_at', 'is', null)
      .lte('ends_at', new Date().toISOString()),
    'getDuePolls'
  ) as Poll[];
}

export async function castPollVote(
  pollId: number,
  userId: string,
  optionKey: string,
  multi: boolean
): Promise<boolean> {
  if (!multi) {
    // Remove existing vote for single choice
    await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('user_id', userId);
  }

  const { error } = await supabase
    .from('poll_votes')
    .upsert({ poll_id: pollId, user_id: userId, option_key: optionKey }, { onConflict: 'poll_id,user_id,option_key' });

  if (error) {
    log.error(`castPollVote: ${error.message}`);
    return false;
  }
  return true;
}

export async function getPollVotes(pollId: number): Promise<PollVote[]> {
  return unwrapList(
    await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', pollId),
    'getPollVotes'
  ) as PollVote[];
}

export async function endPoll(id: number): Promise<void> {
  const { error } = await supabase
    .from('polls')
    .update({ ended: true })
    .eq('id', id);

  if (error) log.error(`endPoll: ${error.message}`);
}
