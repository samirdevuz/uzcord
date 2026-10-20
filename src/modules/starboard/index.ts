import {
  EmbedBuilder,
  type Message,
  type MessageReaction,
  type PartialMessageReaction,
  type PartialUser,
  type User,
} from 'discord.js';
import { createLogger } from '../../core/logger';
import { getSettings, isModuleEnabled } from '../../db/guilds';
import {
  deleteStarboardPost,
  getStarboardPost,
  getStarboardSettings,
  saveStarboardPost,
  type StarboardSettings,
} from '../../db/starboard';
import { createTranslator } from '../../i18n';
import { COLORS, truncate } from '../../utils/embeds';

const log = createLogger('starboard');

const SETTINGS_TTL = 60_000;
const cache = new Map<string, { value: StarboardSettings; at: number }>();
/** Bir xabar uchun reaksiyalar ketma-ket qayta ishlanadi (poyga holatisiz). */
const locks = new Map<string, Promise<void>>();

export async function cachedStarboardSettings(guildId: string): Promise<StarboardSettings> {
  const hit = cache.get(guildId);
  if (hit && Date.now() - hit.at < SETTINGS_TTL) return hit.value;
  const value = await getStarboardSettings(guildId);
  cache.set(guildId, { value, at: Date.now() });
  return value;
}

export function invalidateStarboardSettings(guildId: string): void {
  cache.delete(guildId);
}

/** Reaksiya emojisi sozlangan emojiga mosmi (unicode yoki <:nom:id>). */
export function emojiMatches(configured: string, emoji: { id: string | null; name: string | null }): boolean {
  if (emoji.id) return configured.includes(emoji.id);
  return emoji.name === configured;
}

export function starIcon(count: number): string {
  if (count >= 25) return '✨';
  if (count >= 10) return '💫';
  if (count >= 5) return '🌟';
  return '⭐';
}

function buildStarEmbed(message: Message<true>, jumpLabel: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setAuthor({ name: message.member?.displayName ?? message.author.username, iconURL: message.author.displayAvatarURL() })
    .setTimestamp(message.createdAt)
    .setFooter({ text: message.id });

  const text = message.content || message.embeds[0]?.description || '';
  if (text) embed.setDescription(truncate(text, 3800));

  const image =
    message.attachments.find((attachment) => attachment.contentType?.startsWith('image/'))?.url ??
    message.embeds.find((item) => item.image)?.image?.url;
  if (image) embed.setImage(image);

  const others = message.attachments.filter((attachment) => !attachment.contentType?.startsWith('image/'));
  if (others.size > 0) {
    embed.addFields({ name: '📎', value: truncate(others.map((file) => `[${file.name}](${file.url})`).join('\n')) });
  }

  embed.addFields({ name: '​', value: `[${jumpLabel}](${message.url})` });
  return embed;
}

async function processReaction(reaction: MessageReaction | PartialMessageReaction): Promise<void> {
  if (reaction.partial) reaction = await reaction.fetch();
  const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
  if (!message.inGuild() || message.author.bot) return;

  if (!isModuleEnabled(getSettings(message.guildId), 'starboard')) return;
  const settings = await cachedStarboardSettings(message.guildId);
  if (!settings.enabled || !settings.channel_id) return;
  if (!emojiMatches(settings.emoji, reaction.emoji)) return;

  const sourceChannelId = message.channel.isThread() ? message.channel.parentId ?? message.channelId : message.channelId;
  if (message.channelId === settings.channel_id || settings.ignored_channels.includes(sourceChannelId)) return;

  let count = reaction.count ?? 0;
  if (!settings.allow_self_star && count > 0) {
    const users = await reaction.users.fetch({ limit: 100 }).catch(() => null);
    if (users?.has(message.author.id)) count -= 1;
  }

  const starChannel = await message.guild.channels.fetch(settings.channel_id).catch(() => null);
  if (!starChannel?.isTextBased() || !('send' in starChannel)) return;

  const existing = await getStarboardPost(message.guildId, message.id);
  const existingMessage = existing
    ? await starChannel.messages.fetch(existing.star_message_id).catch(() => null)
    : null;

  if (count < settings.threshold) {
    if (existing) {
      await existingMessage?.delete().catch(() => null);
      await deleteStarboardPost(message.guildId, message.id);
    }
    return;
  }

  const t = createTranslator(getSettings(message.guildId).locale);
  const content = `${starIcon(count)} **${count}** · <#${message.channelId}>`;
  const embed = buildStarEmbed(message, t('starboard.jump'));

  if (existingMessage) {
    await existingMessage.edit({ content, embeds: [embed] });
    await saveStarboardPost({ ...existing!, star_count: count });
    return;
  }

  const posted = await starChannel.send({ content, embeds: [embed], allowedMentions: { parse: [] } });
  await saveStarboardPost({
    guild_id: message.guildId,
    source_message_id: message.id,
    source_channel_id: message.channelId,
    star_message_id: posted.id,
    author_id: message.author.id,
    star_count: count,
  });
}

/** messageReactionAdd / messageReactionRemove eventlaridan chaqiriladi. */
export async function handleStarReaction(
  reaction: MessageReaction | PartialMessageReaction,
  _user: User | PartialUser
): Promise<void> {
  const key = reaction.message.id;
  const previous = locks.get(key) ?? Promise.resolve();
  const next = previous
    .then(() => processReaction(reaction))
    .catch((error: unknown) => log.warn(`Starboard xatosi (${key}):`, error))
    .finally(() => {
      if (locks.get(key) === next) locks.delete(key);
    });
  locks.set(key, next);
  await next;
}
