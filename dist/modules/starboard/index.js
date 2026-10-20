"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachedStarboardSettings = cachedStarboardSettings;
exports.invalidateStarboardSettings = invalidateStarboardSettings;
exports.emojiMatches = emojiMatches;
exports.starIcon = starIcon;
exports.handleStarReaction = handleStarReaction;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const starboard_1 = require("../../db/starboard");
const i18n_1 = require("../../i18n");
const embeds_1 = require("../../utils/embeds");
const log = (0, logger_1.createLogger)('starboard');
const SETTINGS_TTL = 60_000;
const cache = new Map();
/** Bir xabar uchun reaksiyalar ketma-ket qayta ishlanadi (poyga holatisiz). */
const locks = new Map();
async function cachedStarboardSettings(guildId) {
    const hit = cache.get(guildId);
    if (hit && Date.now() - hit.at < SETTINGS_TTL)
        return hit.value;
    const value = await (0, starboard_1.getStarboardSettings)(guildId);
    cache.set(guildId, { value, at: Date.now() });
    return value;
}
function invalidateStarboardSettings(guildId) {
    cache.delete(guildId);
}
/** Reaksiya emojisi sozlangan emojiga mosmi (unicode yoki <:nom:id>). */
function emojiMatches(configured, emoji) {
    if (emoji.id)
        return configured.includes(emoji.id);
    return emoji.name === configured;
}
function starIcon(count) {
    if (count >= 25)
        return '✨';
    if (count >= 10)
        return '💫';
    if (count >= 5)
        return '🌟';
    return '⭐';
}
function buildStarEmbed(message, jumpLabel) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xf5c518)
        .setAuthor({ name: message.member?.displayName ?? message.author.username, iconURL: message.author.displayAvatarURL() })
        .setTimestamp(message.createdAt)
        .setFooter({ text: message.id });
    const text = message.content || message.embeds[0]?.description || '';
    if (text)
        embed.setDescription((0, embeds_1.truncate)(text, 3800));
    const image = message.attachments.find((attachment) => attachment.contentType?.startsWith('image/'))?.url ??
        message.embeds.find((item) => item.image)?.image?.url;
    if (image)
        embed.setImage(image);
    const others = message.attachments.filter((attachment) => !attachment.contentType?.startsWith('image/'));
    if (others.size > 0) {
        embed.addFields({ name: '📎', value: (0, embeds_1.truncate)(others.map((file) => `[${file.name}](${file.url})`).join('\n')) });
    }
    embed.addFields({ name: '​', value: `[${jumpLabel}](${message.url})` });
    return embed;
}
async function processReaction(reaction) {
    if (reaction.partial)
        reaction = await reaction.fetch();
    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
    if (!message.inGuild() || message.author.bot)
        return;
    if (!(0, guilds_1.isModuleEnabled)((0, guilds_1.getSettings)(message.guildId), 'starboard'))
        return;
    const settings = await cachedStarboardSettings(message.guildId);
    if (!settings.enabled || !settings.channel_id)
        return;
    if (!emojiMatches(settings.emoji, reaction.emoji))
        return;
    const sourceChannelId = message.channel.isThread() ? message.channel.parentId ?? message.channelId : message.channelId;
    if (message.channelId === settings.channel_id || settings.ignored_channels.includes(sourceChannelId))
        return;
    let count = reaction.count ?? 0;
    if (!settings.allow_self_star && count > 0) {
        const users = await reaction.users.fetch({ limit: 100 }).catch(() => null);
        if (users?.has(message.author.id))
            count -= 1;
    }
    const starChannel = await message.guild.channels.fetch(settings.channel_id).catch(() => null);
    if (!starChannel?.isTextBased() || !('send' in starChannel))
        return;
    const existing = await (0, starboard_1.getStarboardPost)(message.guildId, message.id);
    const existingMessage = existing
        ? await starChannel.messages.fetch(existing.star_message_id).catch(() => null)
        : null;
    if (count < settings.threshold) {
        if (existing) {
            await existingMessage?.delete().catch(() => null);
            await (0, starboard_1.deleteStarboardPost)(message.guildId, message.id);
        }
        return;
    }
    const t = (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(message.guildId).locale);
    const content = `${starIcon(count)} **${count}** · <#${message.channelId}>`;
    const embed = buildStarEmbed(message, t('starboard.jump'));
    if (existingMessage) {
        await existingMessage.edit({ content, embeds: [embed] });
        await (0, starboard_1.saveStarboardPost)({ ...existing, star_count: count });
        return;
    }
    const posted = await starChannel.send({ content, embeds: [embed], allowedMentions: { parse: [] } });
    await (0, starboard_1.saveStarboardPost)({
        guild_id: message.guildId,
        source_message_id: message.id,
        source_channel_id: message.channelId,
        star_message_id: posted.id,
        author_id: message.author.id,
        star_count: count,
    });
}
/** messageReactionAdd / messageReactionRemove eventlaridan chaqiriladi. */
async function handleStarReaction(reaction, _user) {
    const key = reaction.message.id;
    const previous = locks.get(key) ?? Promise.resolve();
    const next = previous
        .then(() => processReaction(reaction))
        .catch((error) => log.warn(`Starboard xatosi (${key}):`, error))
        .finally(() => {
        if (locks.get(key) === next)
            locks.delete(key);
    });
    locks.set(key, next);
    await next;
}
//# sourceMappingURL=index.js.map