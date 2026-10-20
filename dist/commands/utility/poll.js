"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const polls_1 = require("../../db/polls");
const polls_2 = require("../../modules/polls");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
const MAX_DURATION = 30 * time_1.DAY;
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    cooldown: 10,
    botPermissions: [discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.EmbedLinks],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('poll')
        .setDescription("So'rovnoma yaratadi (tugmalar orqali ovoz berish)")
        .setDMPermission(false)
        .addStringOption((opt) => opt.setName('question').setDescription('Savol').setRequired(true).setMaxLength(250))
        .addStringOption((opt) => opt.setName('option1').setDescription('1-variant').setRequired(true).setMaxLength(100))
        .addStringOption((opt) => opt.setName('option2').setDescription('2-variant').setRequired(true).setMaxLength(100))
        .addStringOption((opt) => opt.setName('option3').setDescription('3-variant').setMaxLength(100))
        .addStringOption((opt) => opt.setName('option4').setDescription('4-variant').setMaxLength(100))
        .addStringOption((opt) => opt.setName('option5').setDescription('5-variant').setMaxLength(100))
        .addStringOption((opt) => opt.setName('duration').setDescription('Davomiyligi: 30m, 2h, 1d (bo\'sh = cheksiz)'))
        .addBooleanOption((opt) => opt.setName('multi').setDescription('Bir nechta variant tanlash mumkinmi?')),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const channel = interaction.channel;
        if (!channel?.isTextBased() || channel.isDMBased()) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.channelType')), true);
            return;
        }
        const question = interaction.options.getString('question', true);
        const labels = ['option1', 'option2', 'option3', 'option4', 'option5']
            .map((name) => interaction.options.getString(name)?.trim())
            .filter((label) => Boolean(label));
        if (new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('poll.duplicateOptions')), true);
            return;
        }
        let endsAt = null;
        const durationInput = interaction.options.getString('duration');
        if (durationInput) {
            const durationMs = (0, time_1.parseDuration)(durationInput);
            if (!durationMs || durationMs < time_1.MINUTE || durationMs > MAX_DURATION) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('poll.invalidDuration')), true);
                return;
            }
            endsAt = new Date(Date.now() + durationMs).toISOString();
        }
        const options = labels.map((label, index) => ({ key: `opt_${index + 1}`, label }));
        const draft = {
            guild_id: interaction.guildId,
            channel_id: channel.id,
            question,
            options,
            multi: interaction.options.getBoolean('multi') ?? false,
            ends_at: endsAt,
            created_by: interaction.user.id,
        };
        const embed = (0, polls_2.buildPollEmbed)(draft, [], t, false).setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
        });
        const message = await channel.send({ embeds: [embed], components: (0, polls_2.pollComponents)(options, false) });
        const saved = await (0, polls_1.createPoll)({ ...draft, message_id: message.id });
        if (!saved) {
            await message.delete().catch(() => null);
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.generic')), true);
            return;
        }
        await interaction.reply({ embeds: [(0, embeds_1.successEmbed)(t('poll.created'))], flags: discord_js_1.MessageFlags.Ephemeral });
    },
});
//# sourceMappingURL=poll.js.map