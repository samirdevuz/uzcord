import { supabase, unwrap, unwrapList } from './supabase';
import { createLogger } from '../core/logger';

const log = createLogger('db:starboard');

export interface StarboardSettings {
  guild_id: string;
  enabled: boolean;
  channel_id: string | null;
  emoji: string;
  threshold: number;
  allow_self_star: boolean;
  ignored_channels: string[];
}

export interface StarboardPost {
  guild_id: string;
  source_message_id: string;
  source_channel_id: string;
  star_message_id: string;
  author_id: string | null;
  star_count: number;
  created_at: string;
}

export async function getStarboardSettings(guildId: string): Promise<StarboardSettings> {
  const { data, error } = await supabase
    .from('starboard_settings')
    .select('*')
    .eq('guild_id', guildId)
    .single();

  if (error || !data) {
    return {
      guild_id: guildId,
      enabled: false,
      channel_id: null,
      emoji: '⭐',
      threshold: 3,
      allow_self_star: false,
      ignored_channels: [],
    };
  }

  return {
    ...data,
    ignored_channels: Array.isArray(data.ignored_channels) ? data.ignored_channels : [],
  };
}

export async function updateStarboardSettings(
  guildId: string,
  patch: Partial<StarboardSettings>
): Promise<void> {
  const { error } = await supabase
    .from('starboard_settings')
    .upsert({ guild_id: guildId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'guild_id' });

  if (error) log.error(`updateStarboardSettings: ${error.message}`);
}

export async function getStarboardPost(
  guildId: string,
  sourceMessageId: string
): Promise<StarboardPost | null> {
  const { data } = await supabase
    .from('starboard_posts')
    .select('*')
    .eq('guild_id', guildId)
    .eq('source_message_id', sourceMessageId)
    .single();

  return data ? (data as StarboardPost) : null;
}

export async function saveStarboardPost(post: Omit<StarboardPost, 'created_at'>): Promise<void> {
  const { error } = await supabase
    .from('starboard_posts')
    .upsert(post, { onConflict: 'guild_id,source_message_id' });

  if (error) log.error(`saveStarboardPost: ${error.message}`);
}

export async function deleteStarboardPost(guildId: string, sourceMessageId: string): Promise<void> {
  const { error } = await supabase
    .from('starboard_posts')
    .delete()
    .eq('guild_id', guildId)
    .eq('source_message_id', sourceMessageId);

  if (error) log.error(`deleteStarboardPost: ${error.message}`);
}
