import { supabase, unwrap, unwrapList } from './supabase';
import { createLogger } from '../core/logger';

const log = createLogger('db:leveling');

export interface LevelSettings {
  guild_id: string;
  enabled: boolean;
  xp_min: number;
  xp_max: number;
  cooldown_seconds: number;
  multiplier: number;
  announce_enabled: boolean;
  announce_channel_id: string | null;
  level_up_message: string;
  ignored_channels: string[];
  no_xp_roles: string[];
  stack_rewards: boolean;
  updated_at?: string;
}

export interface MemberLevel {
  guild_id: string;
  user_id: string;
  user_tag: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  messages: number;
  last_message_at: string | null;
}

export interface LevelReward {
  guild_id: string;
  level: number;
  role_id: string;
}

export async function getLevelSettings(guildId: string): Promise<LevelSettings> {
  const { data, error } = await supabase
    .from('level_settings')
    .select('*')
    .eq('guild_id', guildId)
    .single();

  if (error || !data) {
    return {
      guild_id: guildId,
      enabled: false,
      xp_min: 15,
      xp_max: 25,
      cooldown_seconds: 60,
      multiplier: 1.0,
      announce_enabled: true,
      announce_channel_id: null,
      level_up_message: 'Tabriklaymiz {user}, siz **{level}**-darajaga yetdingiz!',
      ignored_channels: [],
      no_xp_roles: [],
      stack_rewards: true,
    };
  }

  return {
    ...data,
    ignored_channels: Array.isArray(data.ignored_channels) ? data.ignored_channels : [],
    no_xp_roles: Array.isArray(data.no_xp_roles) ? data.no_xp_roles : [],
  };
}

export async function updateLevelSettings(
  guildId: string,
  patch: Partial<LevelSettings>
): Promise<void> {
  const { error } = await supabase
    .from('level_settings')
    .upsert({ guild_id: guildId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'guild_id' });

  if (error) log.error(`updateLevelSettings: ${error.message}`);
}

export async function getMemberLevel(guildId: string, userId: string): Promise<MemberLevel | null> {
  const { data } = await supabase
    .from('member_levels')
    .select('*')
    .eq('guild_id', guildId)
    .eq('user_id', userId)
    .single();

  return data ? (data as MemberLevel) : null;
}

export async function addXp(
  guildId: string,
  userId: string,
  userTag: string | null,
  avatar: string | null,
  amount: number
): Promise<{ xp: number; level: number; oldLevel: number; messages: number } | null> {
  const { data, error } = await supabase.rpc('add_member_xp', {
    p_guild_id: guildId,
    p_user_id: userId,
    p_user_tag: userTag,
    p_avatar: avatar,
    p_amount: amount,
  });

  if (error || !data || data.length === 0) {
    if (error) log.error(`addXp: ${error.message}`);
    return null;
  }

  const row = data[0] as { xp: number; level: number; old_level: number; messages: number };
  return {
    xp: Number(row.xp),
    level: Number(row.level),
    oldLevel: Number(row.old_level),
    messages: Number(row.messages),
  };
}

export async function getLeaderboard(guildId: string, limit = 10): Promise<MemberLevel[]> {
  return unwrapList(
    await supabase
      .from('member_levels')
      .select('*')
      .eq('guild_id', guildId)
      .order('xp', { ascending: false })
      .limit(limit),
    'getLeaderboard'
  ) as MemberLevel[];
}

export async function getMemberRank(guildId: string, userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('member_rank', {
    p_guild_id: guildId,
    p_user_id: userId,
  });

  if (error || data === null) return 0;
  return Number(data);
}

export async function getLevelRewards(guildId: string): Promise<LevelReward[]> {
  return unwrapList(
    await supabase
      .from('level_rewards')
      .select('*')
      .eq('guild_id', guildId)
      .order('level', { ascending: true }),
    'getLevelRewards'
  ) as LevelReward[];
}

export async function setLevelReward(guildId: string, level: number, roleId: string): Promise<void> {
  const { error } = await supabase
    .from('level_rewards')
    .upsert({ guild_id: guildId, level, role_id: roleId }, { onConflict: 'guild_id,level' });

  if (error) log.error(`setLevelReward: ${error.message}`);
}

export async function removeLevelReward(guildId: string, level: number): Promise<void> {
  const { error } = await supabase
    .from('level_rewards')
    .delete()
    .eq('guild_id', guildId)
    .eq('level', level);

  if (error) log.error(`removeLevelReward: ${error.message}`);
}
