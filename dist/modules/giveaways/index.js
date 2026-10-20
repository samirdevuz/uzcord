"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GIVEAWAY_BUTTON = void 0;
exports.pickWinners = pickWinners;
exports.buildGiveawayEmbed = buildGiveawayEmbed;
exports.giveawayComponents = giveawayComponents;
exports.handleGiveawayButton = handleGiveawayButton;
exports.finishGiveaway = finishGiveaway;
exports.rerollGiveaway = rerollGiveaway;
const node_crypto_1 = require("node:crypto");
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const giveaways_1 = require("../../db/giveaways");
const i18n_1 = require("../../i18n");
const embeds_1 = require("../../utils/embeds");
const log = (0, logger_1.createLogger)('giveaways');
exports.GIVEAWAY_BUTTON = 'giveaway_enter';
/** Kriptografik tasodifiy g'oliblar (takrorlanmaydi, `exclude` dagilar tushmaydi). */
function pickWinners(entries, count, exclude = []) {
    const pool = [...new Set(entries)].filter((id) => !exclude.includes(id));
    const winners = [];
    while (winners.length < count && pool.length > 0) {
        winners.push(pool.splice((0, node_crypto_1.randomInt)(pool.length), 1)[0]);
    }
    return winners;
}
function unix(iso) {
    return Math.floor(new Date(iso).getTime() / 1000);
}
function buildGiveawayEmbed(giveaway, t, state) {
    const lines = [];
    if (giveaway.description)
        lines.push(giveaway.description, '');
    lines.push(`**${t('giveaway.host')}:** <@${giveaway.host_id}>`);
    lines.push(`**${t('giveaway.winners')}:** ${giveaway.winner_count}`);
    if (giveaway.required_role_id)
        lines.push(`**${t('giveaway.requiredRole')}:** <@&${giveaway.required_role_id}>`);
    lines.push(`**${t('giveaway.entries')}:** ${state.entries}`);
    if (state.ended) {
        const winners = state.winners ?? [];
        lines.push('', `**${t('giveaway.winners')}:** ${winners.length > 0 ? winners.map((id) => `<@${id}>`).join(', ') : t('giveaway.noEntries')}`, `**${t('giveaway.endedAt')}:** <t:${Math.floor(Date.now() / 1000)}:R>`);
    }
    else {
        lines.push(`**${t('giveaway.ends')}:** <t:${unix(giveaway.ends_at)}:R> (<t:${unix(giveaway.ends_at)}:f>)`);
    }
    return new discord_js_1.EmbedBuilder()
        .setColor(state.ended ? embeds_1.COLORS.neutral : 0xec4899)
        .setTitle(`🎉 ${giveaway.prize}`)
        .setDescription(lines.join('\n'))
        .setFooter({ text: state.ended ? t('giveaway.footerEnded') : t('giveaway.footerActive') })
        .setTimestamp(new Date(giveaway.ends_at));
}
function giveawayComponents(t, entries, ended) {
    return [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(exports.GIVEAWAY_BUTTON)
            .setLabel(`${t('giveaway.enterButton')} (${entries})`)
            .setEmoji('🎉')
            .setStyle(ended ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Success)
            .setDisabled(ended)),
    ];
}
async function handleGiveawayButton(interaction) {
    if (interaction.customId !== exports.GIVEAWAY_BUTTON)
        return false;
    const t = (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(interaction.guildId).locale);
    const giveaway = await (0, giveaways_1.getGiveawayByMessage)(interaction.message.id);
    if (!giveaway || giveaway.guild_id !== interaction.guildId) {
        await interaction.reply({ embeds: [(0, embeds_1.errorEmbed)(t('giveaway.notFound'))], flags: discord_js_1.MessageFlags.Ephemeral });
        return true;
    }
    if (giveaway.ended || new Date(giveaway.ends_at).getTime() <= Date.now()) {
        await interaction.reply({ embeds: [(0, embeds_1.errorEmbed)(t('giveaway.ended'))], flags: discord_js_1.MessageFlags.Ephemeral });
        return true;
    }
    if (giveaway.required_role_id && !interaction.member.roles.cache.has(giveaway.required_role_id)) {
        await interaction.reply({
            embeds: [(0, embeds_1.errorEmbed)(t('giveaway.missingRole', { role: `<@&${giveaway.required_role_id}>` }))],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return true;
    }
    // Ikkinchi bosish — qatnashishdan chiqish.
    const joined = await (0, giveaways_1.addGiveawayEntry)(giveaway.id, interaction.user.id);
    if (!joined)
        await (0, giveaways_1.removeGiveawayEntry)(giveaway.id, interaction.user.id);
    const entries = await (0, giveaways_1.countGiveawayEntries)(giveaway.id);
    await interaction.update({ components: giveawayComponents(t, entries, false) });
    await interaction.followUp({
        content: joined ? t('giveaway.entered') : t('giveaway.left'),
        flags: discord_js_1.MessageFlags.Ephemeral,
    });
    return true;
}
/**
 * Konkursni yakunlaydi: g'oliblarni tanlaydi, xabarni yangilaydi va e'lon qiladi.
 * Scheduler va /giveaway end ikkalasi ham shuni chaqiradi; bazadagi atomik
 * belgi tufayli bir konkurs ikki marta yakunlanmaydi.
 */
async function finishGiveaway(client, giveaway) {
    if (!(await (0, giveaways_1.claimGiveawayEnd)(giveaway.id)))
        return null;
    const t = (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(giveaway.guild_id).locale);
    const entries = await (0, giveaways_1.getGiveawayEntries)(giveaway.id);
    const winners = pickWinners(entries, giveaway.winner_count);
    await (0, giveaways_1.setGiveawayWinners)(giveaway.id, winners);
    try {
        const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
        if (!channel?.isTextBased() || !('send' in channel))
            return winners;
        const message = giveaway.message_id ? await channel.messages.fetch(giveaway.message_id).catch(() => null) : null;
        if (message) {
            await message.edit({
                embeds: [buildGiveawayEmbed(giveaway, t, { entries: entries.length, ended: true, winners })],
                components: giveawayComponents(t, entries.length, true),
            });
        }
        const text = winners.length > 0
            ? t('giveaway.winnerAnnounce', { winners: winners.map((id) => `<@${id}>`).join(', '), prize: giveaway.prize })
            : t('giveaway.noWinners', { prize: giveaway.prize });
        await channel.send({
            content: text,
            reply: message ? { messageReference: message.id, failIfNotExists: false } : undefined,
            allowedMentions: { users: winners },
        });
    }
    catch (error) {
        log.warn(`Konkurs natijasini e'lon qilib bo'lmadi (#${giveaway.id}):`, error);
    }
    return winners;
}
/** Avvalgi g'oliblarni chiqarib tashlab, yangilarini tanlaydi. */
async function rerollGiveaway(giveaway, count) {
    const entries = await (0, giveaways_1.getGiveawayEntries)(giveaway.id);
    const fresh = pickWinners(entries, count, giveaway.winners ?? []);
    if (fresh.length > 0)
        await (0, giveaways_1.setGiveawayWinners)(giveaway.id, [...(giveaway.winners ?? []), ...fresh]);
    return fresh;
}
//# sourceMappingURL=index.js.map