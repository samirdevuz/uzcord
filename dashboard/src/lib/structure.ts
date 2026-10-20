import { db } from './supabase';

/** Bot `guilds.channels` / `guilds.roles` ga yozadigan ko'rinish (src/modules/structure). */
export interface GuildChannel {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
  position: number;
}

export interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

/** Discord kanal turlari (discord-api-types ChannelType). */
export const CHANNEL_TYPE = {
  text: 0,
  voice: 2,
  category: 4,
  announcement: 5,
  stage: 13,
  forum: 15,
} as const;

export const TEXT_TYPES: readonly number[] = [CHANNEL_TYPE.text, CHANNEL_TYPE.announcement];

export interface GuildStructure {
  channels: GuildChannel[];
  roles: GuildRole[];
  synced: boolean;
}

export async function getGuildStructure(guildId: string): Promise<GuildStructure> {
  const { data } = await db
    .from('guilds')
    .select('channels, roles, structure_synced')
    .eq('guild_id', guildId)
    .maybeSingle();
  const channels = Array.isArray(data?.channels) ? (data.channels as GuildChannel[]) : [];
  const roles = Array.isArray(data?.roles) ? (data.roles as GuildRole[]) : [];
  return { channels, roles, synced: Boolean(data?.structure_synced) };
}

export function roleColor(color: number): string {
  return color ? `#${color.toString(16).padStart(6, '0')}` : '#94a3b8';
}

/** Kanallarni kategoriyalar bo'yicha guruhlaydi (Discord'dagi tartibda). */
export function groupChannels(channels: GuildChannel[], types: readonly number[]): { label: string | null; items: GuildChannel[] }[] {
  const categories = channels.filter((channel) => channel.type === CHANNEL_TYPE.category);
  const wanted = channels.filter((channel) => types.includes(channel.type));
  const groups: { label: string | null; items: GuildChannel[] }[] = [];

  const loose = wanted.filter((channel) => !channel.parent_id || !categories.some((cat) => cat.id === channel.parent_id));
  if (loose.length > 0) groups.push({ label: null, items: loose });
  for (const category of categories) {
    const items = wanted.filter((channel) => channel.parent_id === category.id);
    if (items.length > 0) groups.push({ label: category.name, items });
  }
  return groups;
}
