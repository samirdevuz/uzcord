import { createLogger } from '../core/logger';
import { supabase, unwrapList } from './supabase';
import type { ButtonRole } from './types';

export type { ButtonRole } from './types';

const log = createLogger('db:roles');

export async function addButtonRole(
  data: Omit<ButtonRole, 'id' | 'position'> & { position?: number }
): Promise<boolean> {
  const { error } = await supabase.from('button_roles').insert({
    guild_id: data.guild_id,
    channel_id: data.channel_id,
    message_id: data.message_id,
    role_id: data.role_id,
    label: data.label,
    emoji: data.emoji,
    position: data.position ?? 0,
  });

  if (error) {
    if (!error.message.includes('duplicate')) log.error(`addButtonRole: ${error.message}`);
    return false;
  }
  return true;
}

export async function getPanelRoles(messageId: string): Promise<ButtonRole[]> {
  return unwrapList(
    await supabase
      .from('button_roles')
      .select('*')
      .eq('message_id', messageId)
      .order('id', { ascending: true }),
    `getPanelRoles(${messageId})`
  ) as ButtonRole[];
}

export async function removeButtonRole(messageId: string, roleId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('button_roles')
    .delete()
    .eq('message_id', messageId)
    .eq('role_id', roleId)
    .select('id');

  if (error) {
    log.error(`removeButtonRole: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

export async function isPanelMessage(messageId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('button_roles')
    .select('id', { count: 'exact', head: true })
    .eq('message_id', messageId);
  if (error) return false;
  return (count ?? 0) > 0;
}
