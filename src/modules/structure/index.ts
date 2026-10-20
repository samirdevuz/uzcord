import { ChannelType, type Guild } from 'discord.js';
import { createLogger } from '../../core/logger';
import { supabase } from '../../db/supabase';

const log = createLogger('structure');

/** Dashboard'da tanlash mumkin bo'lgan kanal turlari. */
const CHANNEL_TYPES = new Set<ChannelType>([
  ChannelType.GuildText,
  ChannelType.GuildVoice,
  ChannelType.GuildCategory,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildStageVoice,
  ChannelType.GuildForum,
]);

export interface SyncedChannel {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
  position: number;
}

export interface SyncedRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export function serializeChannels(guild: Guild): SyncedChannel[] {
  return [...guild.channels.cache.values()]
    .filter((channel) => CHANNEL_TYPES.has(channel.type))
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      parent_id: 'parentId' in channel ? channel.parentId : null,
      position: 'rawPosition' in channel ? channel.rawPosition : 0,
    }))
    .sort((a, b) => a.position - b.position);
}

export function serializeRoles(guild: Guild): SyncedRole[] {
  return [...guild.roles.cache.values()]
    .filter((role) => role.id !== guild.id) // @everyone
    .map((role) => ({ id: role.id, name: role.name, color: role.color, position: role.position, managed: role.managed }))
    .sort((a, b) => b.position - a.position);
}

const pending = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 5000;

export async function syncGuildStructure(guild: Guild): Promise<void> {
  const { error } = await supabase
    .from('guilds')
    .update({
      channels: serializeChannels(guild),
      roles: serializeRoles(guild),
      structure_synced: new Date().toISOString(),
    })
    .eq('guild_id', guild.id);
  if (error) log.warn(`Tuzilmani yozib bo'lmadi (${guild.id}): ${error.message}`);
}

/**
 * Kanal/rol o'zgarishlari ko'pincha ketma-ket keladi (masalan, kategoriya
 * ko'chirilganda) — shuning uchun 5 soniya jimlikdan keyin bir marta yoziladi.
 */
export function scheduleStructureSync(guild: Guild): void {
  const existing = pending.get(guild.id);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    pending.delete(guild.id);
    void syncGuildStructure(guild);
  }, DEBOUNCE_MS);
  timer.unref();
  pending.set(guild.id, timer);
}
