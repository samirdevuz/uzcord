import { supabase, unwrap, unwrapList } from './supabase';
import { createLogger } from '../core/logger';

const log = createLogger('db:tickets');

export interface TicketSettings {
  guild_id: string;
  enabled: boolean;
  category_id: string | null;
  transcript_channel_id: string | null;
  support_role_ids: string[];
  panel_channel_id: string | null;
  panel_message_id: string | null;
  panel_title: string;
  panel_description: string;
  open_message: string;
  max_open_per_user: number;
  next_number: number;
}

export interface Ticket {
  id: number;
  guild_id: string;
  ticket_number: number;
  channel_id: string;
  opener_id: string;
  opener_tag: string | null;
  topic: string | null;
  status: 'open' | 'claimed' | 'closed';
  claimed_by: string | null;
  closed_by: string | null;
  close_reason: string | null;
  message_count: number;
  transcript: string | null;
  created_at: string;
  closed_at: string | null;
}

export async function getTicketSettings(guildId: string): Promise<TicketSettings> {
  const { data, error } = await supabase
    .from('ticket_settings')
    .select('*')
    .eq('guild_id', guildId)
    .single();

  if (error || !data) {
    return {
      guild_id: guildId,
      enabled: false,
      category_id: null,
      transcript_channel_id: null,
      support_role_ids: [],
      panel_channel_id: null,
      panel_message_id: null,
      panel_title: 'Yordam kerakmi?',
      panel_description: 'Quyidagi tugmani bosib moderatorlarga murojaat qiling.',
      open_message: 'Salom {user}! Muammoingizni batafsil yozing, moderatorlar tez orada javob beradi.',
      max_open_per_user: 1,
      next_number: 1,
    };
  }

  return {
    ...data,
    support_role_ids: Array.isArray(data.support_role_ids) ? data.support_role_ids : [],
  };
}

export async function updateTicketSettings(
  guildId: string,
  patch: Partial<TicketSettings>
): Promise<void> {
  const { error } = await supabase
    .from('ticket_settings')
    .upsert({ guild_id: guildId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'guild_id' });

  if (error) log.error(`updateTicketSettings: ${error.message}`);
}

export async function getNextTicketNumber(guildId: string): Promise<number> {
  const { data, error } = await supabase.rpc('next_ticket_number', { p_guild_id: guildId });
  if (error || data === null) {
    log.error(`getNextTicketNumber: ${error?.message}`);
    return 1;
  }
  return Number(data);
}

export async function createTicket(
  ticket: Omit<Ticket, 'id' | 'created_at' | 'closed_at' | 'claimed_by' | 'closed_by' | 'close_reason' | 'message_count' | 'transcript'>
): Promise<Ticket | null> {
  return unwrap(
    await supabase.from('tickets').insert(ticket).select().single(),
    'createTicket'
  ) as Ticket | null;
}

export async function getOpenTicketsForUser(guildId: string, openerId: string): Promise<Ticket[]> {
  return unwrapList(
    await supabase
      .from('tickets')
      .select('*')
      .eq('guild_id', guildId)
      .eq('opener_id', openerId)
      .neq('status', 'closed'),
    'getOpenTicketsForUser'
  ) as Ticket[];
}

export async function getTicketByChannel(channelId: string): Promise<Ticket | null> {
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .eq('channel_id', channelId)
    .single();

  return data ? (data as Ticket) : null;
}

export async function updateTicket(
  id: number,
  patch: Partial<Ticket>
): Promise<void> {
  const { error } = await supabase.from('tickets').update(patch).eq('id', id);
  if (error) log.error(`updateTicket: ${error.message}`);
}
