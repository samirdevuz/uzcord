/**
 * Baza jadvallarining TypeScript ko'rinishi.
 *
 * Eslatma: Postgres da timestamptz ishlatiladi, lekin bot ichida vaqtlar
 * millisekund (number) sifatida yuritiladi — shuning uchun o'qishda
 * `toMs()` orqali aylantiriladi.
 */

export type LogKind = 'mod' | 'message' | 'member' | 'server' | 'voice';

export interface GuildSettings {
  guild_id: string;
  name: string | null;
  icon: string | null;
  member_count: number | null;
  locale: string;
  mod_log_channel_id: string | null;
  message_log_channel_id: string | null;
  member_log_channel_id: string | null;
  server_log_channel_id: string | null;
  voice_log_channel_id: string | null;
  welcome_channel_id: string | null;
  welcome_message: string | null;
  goodbye_channel_id: string | null;
  goodbye_message: string | null;
  autorole_id: string | null;
  dm_on_punish: boolean;
  modules: Record<string, boolean>;
  bot_present: boolean;
  created_at: number;
  updated_at: number;
}

export const LOG_COLUMNS: Record<LogKind, keyof GuildSettings> = {
  mod: 'mod_log_channel_id',
  message: 'message_log_channel_id',
  member: 'member_log_channel_id',
  server: 'server_log_channel_id',
  voice: 'voice_log_channel_id',
};

export type ModuleName =
  | 'moderation'
  | 'automod'
  | 'logging'
  | 'welcome'
  | 'roles'
  | 'leveling'
  | 'tickets'
  | 'starboard';

export const MODULE_NAMES: ModuleName[] = [
  'moderation',
  'automod',
  'logging',
  'welcome',
  'roles',
  'leveling',
  'tickets',
  'starboard',
];

export type CaseType =
  | 'ban'
  | 'tempban'
  | 'unban'
  | 'kick'
  | 'timeout'
  | 'untimeout'
  | 'warn'
  | 'unwarn'
  | 'automod';

export interface ModCase {
  id: number;
  guild_id: string;
  case_number: number;
  type: CaseType;
  user_id: string;
  user_tag: string | null;
  moderator_id: string;
  moderator_tag: string | null;
  reason: string | null;
  duration_ms: number | null;
  active: boolean;
  created_at: number;
}

export interface NewCase {
  guildId: string;
  type: CaseType;
  userId: string;
  userTag?: string | null;
  moderatorId: string;
  moderatorTag?: string | null;
  reason?: string | null;
  durationMs?: number | null;
}

export interface TempAction {
  id: number;
  guild_id: string;
  user_id: string;
  type: 'ban';
  case_number: number | null;
  expires_at: number;
  created_at: number;
}

export interface Escalation {
  guild_id: string;
  warn_count: number;
  action: 'timeout' | 'kick' | 'ban';
  duration_ms: number | null;
}

export interface AutoModSettings {
  guild_id: string;
  enabled: boolean;
  anti_spam: boolean;
  spam_limit: number;
  spam_window_ms: number;
  anti_duplicate: boolean;
  anti_invite: boolean;
  anti_link: boolean;
  anti_mention: boolean;
  mention_limit: number;
  anti_caps: boolean;
  caps_percent: number;
  anti_emoji: boolean;
  emoji_limit: number;
  word_filter: boolean;
  anti_raid: boolean;
  raid_join_limit: number;
  raid_window_ms: number;
  min_account_age_days: number;
  punishment: 'delete' | 'warn' | 'timeout' | 'kick' | 'ban';
  punishment_ms: number;
  ignored_channels: string[];
  ignored_roles: string[];
  allowed_domains: string[];
}

export type ToggleFeature =
  | 'anti_spam'
  | 'anti_duplicate'
  | 'anti_invite'
  | 'anti_link'
  | 'anti_mention'
  | 'anti_caps'
  | 'anti_emoji'
  | 'word_filter'
  | 'anti_raid';

export const TOGGLE_FEATURES: ToggleFeature[] = [
  'anti_spam',
  'anti_duplicate',
  'anti_invite',
  'anti_link',
  'anti_mention',
  'anti_caps',
  'anti_emoji',
  'word_filter',
  'anti_raid',
];

export interface ButtonRole {
  id: number;
  guild_id: string;
  channel_id: string;
  message_id: string;
  role_id: string;
  label: string;
  emoji: string | null;
  position: number;
}
