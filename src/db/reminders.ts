import { supabase, unwrap, unwrapList } from './supabase';
import { createLogger } from '../core/logger';

const log = createLogger('db:reminders');

export interface Reminder {
  id: number;
  guild_id: string | null;
  channel_id: string | null;
  user_id: string;
  content: string;
  remind_at: string;
  delivered: boolean;
  created_at: string;
}

export async function createReminder(
  reminder: Omit<Reminder, 'id' | 'delivered' | 'created_at'>
): Promise<Reminder | null> {
  return unwrap(
    await supabase.from('reminders').insert(reminder).select().single(),
    'createReminder'
  ) as Reminder | null;
}

export async function getDueReminders(): Promise<Reminder[]> {
  return unwrapList(
    await supabase
      .from('reminders')
      .select('*')
      .eq('delivered', false)
      .lte('remind_at', new Date().toISOString()),
    'getDueReminders'
  ) as Reminder[];
}

export async function markReminderDelivered(id: number): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .update({ delivered: true })
    .eq('id', id);

  if (error) log.error(`markReminderDelivered: ${error.message}`);
}

export async function getUserReminders(userId: string): Promise<Reminder[]> {
  return unwrapList(
    await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('delivered', false)
      .order('remind_at', { ascending: true }),
    'getUserReminders'
  ) as Reminder[];
}

export async function deleteReminder(id: number, userId: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('reminders')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    log.error(`deleteReminder: ${error.message}`);
    return false;
  }
  return (count ?? 0) > 0;
}
