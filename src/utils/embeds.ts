import { EmbedBuilder, type ColorResolvable } from 'discord.js';

/**
 * Ranglar O'zbekiston bayrog'i palitrasidan — dashboard bilan bir xil
 * (dashboard/tailwind.config.ts: brand, leaf, flag.red).
 */
export const COLORS = {
  brand: 0x14a9c9, // bayroqdagi ko'k
  info: 0x14a9c9,
  success: 0x1eb53a, // bayroqdagi yashil
  warning: 0xf5a524,
  danger: 0xe5484d,
  neutral: 0x5c6b80,
  purple: 0x8b5cf6,
  gold: 0xf5c518,
  pink: 0xec4899,
  indigo: 0x6366f1,
} as const;

export const FOOTER_TEXT = 'UzCord';

/** Bot tizimga kirgach o'rnatiladi — footerlarda bot avatari ko'rinadi. */
let footerIcon: string | undefined;

export function setBrandIcon(url: string | undefined): void {
  footerIcon = url;
}

export function brandFooter(text = FOOTER_TEXT): { text: string; iconURL?: string } {
  return { text, iconURL: footerIcon };
}

function base(color: ColorResolvable): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setTimestamp();
}

export function successEmbed(description: string, title?: string): EmbedBuilder {
  const embed = base(COLORS.success).setDescription(`✅ ${description}`);
  if (title) embed.setTitle(title);
  return embed;
}

export function errorEmbed(description: string, title?: string): EmbedBuilder {
  const embed = base(COLORS.danger).setDescription(`❌ ${description}`);
  if (title) embed.setTitle(title);
  return embed;
}

export function warningEmbed(description: string, title?: string): EmbedBuilder {
  const embed = base(COLORS.warning).setDescription(`⚠️ ${description}`);
  if (title) embed.setTitle(title);
  return embed;
}

export function infoEmbed(description?: string, title?: string): EmbedBuilder {
  const embed = base(COLORS.info);
  if (description) embed.setDescription(description);
  if (title) embed.setTitle(title);
  return embed;
}

export function brandEmbed(title?: string, description?: string): EmbedBuilder {
  const embed = base(COLORS.brand).setFooter(brandFooter());
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

/** Har bir jazo turi uchun rang. */
export const CASE_COLORS: Record<string, number> = {
  ban: COLORS.danger,
  tempban: COLORS.danger,
  unban: COLORS.success,
  kick: COLORS.warning,
  timeout: COLORS.warning,
  untimeout: COLORS.success,
  warn: COLORS.warning,
  unwarn: COLORS.success,
  automod: COLORS.purple,
};

export const CASE_EMOJI: Record<string, string> = {
  ban: '🔨',
  tempban: '⏳',
  unban: '🔓',
  kick: '👢',
  timeout: '🔇',
  untimeout: '🔊',
  warn: '⚠️',
  unwarn: '✅',
  automod: '🤖',
};

/** Uzun matnni embed chegaralariga moslaydi. */
export function truncate(text: string, max = 1024): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}
