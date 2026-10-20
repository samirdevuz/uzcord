"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NUMBER_EMOJI = exports.POLL_PREFIX = void 0;
exports.tallyVotes = tallyVotes;
exports.resultBar = resultBar;
exports.buildPollEmbed = buildPollEmbed;
exports.pollComponents = pollComponents;
exports.handlePollButton = handlePollButton;
exports.finishPoll = finishPoll;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const polls_1 = require("../../db/polls");
const i18n_1 = require("../../i18n");
const embeds_1 = require("../../utils/embeds");
const log = (0, logger_1.createLogger)('polls');
exports.POLL_PREFIX = 'poll_vote:';
exports.NUMBER_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
/** Har bir variant bo'yicha ovozlar soni va foizi. */
function tallyVotes(options, votes) {
    const counts = new Map();
    for (const vote of votes)
        counts.set(vote.option_key, (counts.get(vote.option_key) ?? 0) + 1);
    const total = votes.length;
    const results = options.map((option) => {
        const count = counts.get(option.key) ?? 0;
        return { option, votes: count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
    });
    return { results, voters: new Set(votes.map((vote) => vote.user_id)).size };
}
function resultBar(percent, size = 14) {
    const filled = Math.round((percent / 100) * size);
    return '█'.repeat(filled) + '░'.repeat(size - filled);
}
function buildPollEmbed(poll, votes, t, ended) {
    const { results, voters } = tallyVotes(poll.options, votes);
    const top = Math.max(0, ...results.map((result) => result.votes));
    const lines = results.map((result, index) => {
        const lead = ended && top > 0 && result.votes === top ? ' 🏆' : '';
        return (`${exports.NUMBER_EMOJI[index]} **${result.option.label}**${lead}\n` +
            `\`${resultBar(result.percent)}\` ${result.percent}% · ${result.votes}`);
    });
    if (ended) {
        const leaders = results.filter((result) => top > 0 && result.votes === top);
        lines.push('', leaders.length === 0
            ? t('poll.noVotes')
            : leaders.length > 1
                ? t('poll.tie')
                : t('poll.result', { option: leaders[0].option.label, percent: leaders[0].percent }));
    }
    else if (poll.ends_at) {
        const ts = Math.floor(new Date(poll.ends_at).getTime() / 1000);
        lines.push('', `**${t('poll.ends')}:** <t:${ts}:R>`);
    }
    const mode = poll.multi ? t('poll.modeMulti') : t('poll.modeSingle');
    return new discord_js_1.EmbedBuilder()
        .setColor(ended ? embeds_1.COLORS.neutral : 0x6366f1)
        .setTitle(`📊 ${poll.question}`)
        .setDescription(lines.join('\n\n').replace(/\n\n\n/g, '\n\n'))
        .setFooter({ text: `${t('poll.footer', { count: voters, mode })}${ended ? ` · ${t('poll.ended')}` : ''}` })
        .setTimestamp();
}
function pollComponents(options, ended) {
    const row = new discord_js_1.ActionRowBuilder();
    options.forEach((option, index) => {
        row.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`${exports.POLL_PREFIX}${option.key}`)
            .setLabel(option.label.slice(0, 70))
            .setEmoji(exports.NUMBER_EMOJI[index])
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(ended));
    });
    return [row];
}
/** Avvalgi embeddagi muallif qatorini yangi embedga ko'chiradi. */
function keepAuthor(embed, source) {
    const author = source.embeds[0]?.author;
    if (author)
        embed.setAuthor({ name: author.name, iconURL: author.iconURL ?? undefined });
    return embed;
}
async function handlePollButton(interaction) {
    if (!interaction.customId.startsWith(exports.POLL_PREFIX))
        return false;
    const t = (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(interaction.guildId).locale);
    const key = interaction.customId.slice(exports.POLL_PREFIX.length);
    const poll = await (0, polls_1.getPollByMessage)(interaction.message.id);
    if (!poll || poll.guild_id !== interaction.guildId) {
        await interaction.reply({ embeds: [(0, embeds_1.errorEmbed)(t('poll.notFound'))], flags: discord_js_1.MessageFlags.Ephemeral });
        return true;
    }
    const option = poll.options.find((item) => item.key === key);
    if (!option)
        return true;
    if (poll.ended || (poll.ends_at && new Date(poll.ends_at).getTime() <= Date.now())) {
        await interaction.reply({ embeds: [(0, embeds_1.errorEmbed)(t('poll.closed'))], flags: discord_js_1.MessageFlags.Ephemeral });
        return true;
    }
    const before = await (0, polls_1.getPollVotes)(poll.id);
    const already = before.some((vote) => vote.user_id === interaction.user.id && vote.option_key === key);
    if (already)
        await (0, polls_1.removePollVote)(poll.id, interaction.user.id, key);
    else
        await (0, polls_1.castPollVote)(poll.id, interaction.user.id, key, poll.multi);
    const votes = await (0, polls_1.getPollVotes)(poll.id);
    await interaction.update({ embeds: [keepAuthor(buildPollEmbed(poll, votes, t, false), interaction.message)] });
    await interaction.followUp({
        content: already ? t('poll.unvoted', { option: option.label }) : t('poll.voted', { option: option.label }),
        flags: discord_js_1.MessageFlags.Ephemeral,
    });
    return true;
}
/** So'rovnomani yakunlaydi va xabarni yakuniy natija bilan yangilaydi. */
async function finishPoll(client, poll) {
    if (!(await (0, polls_1.claimPollEnd)(poll.id)))
        return;
    const t = (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(poll.guild_id).locale);
    try {
        const channel = await client.channels.fetch(poll.channel_id).catch(() => null);
        if (!channel?.isTextBased() || !poll.message_id)
            return;
        const message = await channel.messages.fetch(poll.message_id).catch(() => null);
        if (!message)
            return;
        const votes = await (0, polls_1.getPollVotes)(poll.id);
        await message.edit({ embeds: [keepAuthor(buildPollEmbed(poll, votes, t, true), message)], components: pollComponents(poll.options, true) });
    }
    catch (error) {
        log.warn(`So'rovnomani yakunlab bo'lmadi (#${poll.id}):`, error);
    }
}
//# sourceMappingURL=index.js.map