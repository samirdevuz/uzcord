import { EmbedBuilder, type ColorResolvable } from 'discord.js';

export const COLORS = {
  brand: 0x1eb53a, // O'zbekiston bayrog'idagi yashil
  info: 0x0099ff,
  success: 0x2ecc71,
  warning: 0xf1c40f,
  danger: 0xe74c3c,
  neutral: 0x95a5a6,
  purple: 0x9b59b6,
} as const;

export const FOOTER_TEXT = 'UzCord';

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
  const embed = base(COLORS.brand).setFooter({ text: FOOTER_TEXT });
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
