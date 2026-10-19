/**
 * Ko'rsatish uchun yordamchi funksiyalar va standart qiymatlar.
 * Bot bilan bir xil natija berishi uchun src/utils/time.ts va
 * src/db/cache.ts dagi mantiq takrorlangan.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const LABELS: Array<[number, string]> = [
  [WEEK, 'hafta'],
  [DAY, 'kun'],
  [HOUR, 'soat'],
  [MINUTE, 'daqiqa'],
  [SECOND, 'soniya'],
];

/** Millisekundni o'qishga qulay ko'rinishga aylantiradi: "2 kun 3 soat". */
export function formatDuration(ms: number | null | undefined, maxParts = 2): string {
  if (!ms || ms <= 0) return '—';
  const parts: string[] = [];
  let remaining = ms;
  for (const [size, label] of LABELS) {
    if (remaining < size) continue;
    const amount = Math.floor(remaining / size);
    remaining -= amount * size;
    parts.push(`${amount} ${label}`);
    if (parts.length >= maxParts) break;
  }
  return parts.length > 0 ? parts.join(' ') : '1 soniyadan kam';
}

const DATE_FORMAT = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: 'Asia/Tashkent',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** Postgres timestamptz (ISO matn) -> "19.10.2026, 14:05" (Toshkent vaqti). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMAT.format(date);
}

// ── Moderatsiya case turlari ────────────────────────────────────────────────

export const CASE_TYPES = [
  'ban',
  'tempban',
  'unban',
  'kick',
  'timeout',
  'untimeout',
  'warn',
  'unwarn',
  'automod',
] as const;

export type CaseType = (typeof CASE_TYPES)[number];

export const CASE_LABELS: Record<CaseType, string> = {
  ban: 'Ban',
  tempban: 'Vaqtinchalik ban',
  unban: 'Unban',
  kick: 'Kick',
  timeout: 'Timeout',
  untimeout: 'Timeout olindi',
  warn: 'Ogohlantirish',
  unwarn: 'Ogohlantirish olindi',
  automod: 'AutoMod',
};

/** Case turlari uchun yorliq ranglari (Badge komponentiga). */
const CASE_TONES: Record<CaseType, string> = {
  ban: 'border-red-800/60 bg-red-950/50 text-red-300',
  tempban: 'border-orange-800/60 bg-orange-950/40 text-orange-300',
  unban: 'border-leaf/30 bg-leaf/10 text-leaf-light',
  kick: 'border-amber-800/60 bg-amber-950/40 text-amber-300',
  timeout: 'border-violet-800/60 bg-violet-950/40 text-violet-300',
  untimeout: 'border-teal-800/60 bg-teal-950/40 text-teal-300',
  warn: 'border-yellow-800/60 bg-yellow-950/30 text-yellow-300',
  unwarn: 'border-leaf/30 bg-leaf/10 text-leaf-light',
  automod: 'border-brand/30 bg-brand/10 text-brand-light',
};

export function caseLabel(type: string): string {
  return CASE_LABELS[type as CaseType] ?? type;
}

export function caseTone(type: string): string {
  return CASE_TONES[type as CaseType] ?? 'border-ink-500 bg-ink-700 text-slate-300';
}

export function isCaseType(value: string): value is CaseType {
  return (CASE_TYPES as readonly string[]).includes(value);
}

// ── Modullar ────────────────────────────────────────────────────────────────

export const MODULES: { name: string; label: string; hint: string; available: boolean }[] = [
  { name: 'moderation', label: 'Moderatsiya', hint: '/ban, /kick, /warn va boshqa komandalar', available: true },
  { name: 'automod', label: 'AutoMod', hint: 'Spam, havolalar, taqiqlangan so‘zlar, reyd himoyasi', available: true },
  { name: 'logging', label: 'Loglar', hint: 'Xabar, a‘zo, ban va ovozli kanal loglari', available: true },
  { name: 'welcome', label: 'Kutib olish', hint: 'Xush kelibsiz / xayrlashuv xabarlari, avtomatik rol', available: true },
  { name: 'roles', label: 'Tugmali rollar', hint: '/buttonrole panellari', available: true },
  { name: 'leveling', label: 'Leveling', hint: 'Tez kunda — hali botda ishlamaydi', available: false },
  { name: 'tickets', label: 'Ticketlar', hint: 'Tez kunda — hali botda ishlamaydi', available: false },
  { name: 'starboard', label: 'Starboard', hint: 'Tez kunda — hali botda ishlamaydi', available: false },
];

/** Bot bilan bir xil qoida: modul faqat aniq `false` bo'lsa o'chiq. */
export function isModuleEnabled(modules: unknown, name: string): boolean {
  if (!modules || typeof modules !== 'object') return true;
  return (modules as Record<string, unknown>)[name] !== false;
}

// ── Standart qiymatlar (baza defaultlari bilan bir xil) ────────────────────

export const AUTOMOD_DEFAULTS = {
  enabled: false,
  anti_spam: true,
  spam_limit: 5,
  spam_window_ms: 5000,
  anti_duplicate: true,
  anti_invite: true,
  anti_link: false,
  anti_mention: true,
  mention_limit: 5,
  anti_caps: true,
  caps_percent: 70,
  anti_emoji: false,
  emoji_limit: 10,
  word_filter: true,
  anti_raid: true,
  raid_join_limit: 8,
  raid_window_ms: 15000,
  min_account_age_days: 0,
  punishment: 'warn',
  punishment_ms: 600000,
  ignored_channels: [] as string[],
  ignored_roles: [] as string[],
  allowed_domains: [] as string[],
};

export type AutoModRow = typeof AUTOMOD_DEFAULTS;

export const LEVEL_DEFAULTS = {
  enabled: false,
  xp_min: 15,
  xp_max: 25,
  cooldown_seconds: 60,
  announce_enabled: true,
  announce_channel_id: null as string | null,
  level_up_message: 'Tabriklaymiz {user}, siz **{level}**-darajaga yetdingiz!',
  stack_rewards: true,
};

export type LevelRow = typeof LEVEL_DEFAULTS;
