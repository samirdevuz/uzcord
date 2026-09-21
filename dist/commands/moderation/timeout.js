"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.ModerateMembers],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('timeout')
        .setDescription("A'zoga vaqtinchalik jimlik (timeout) beradi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addUserOption((option) => option.setName('user').setDescription("Timeout beriladigan a'zo").setRequired(true))
        .addStringOption((option) => option
        .setName('duration')
        .setDescription("Muddat: 10m, 2h, 7d (eng ko'pi 28 kun)")
        .setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription("Sabab").setMaxLength(400)),
    async execute(interaction, ctx) {
        const { t, settings } = ctx;
        const guild = interaction.guild;
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason');
        const durationMs = (0, time_1.parseDuration)(interaction.options.getString('duration', true));
        if (durationMs === null) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.invalidDuration')), true);
            return;
        }
        if (durationMs > time_1.MAX_TIMEOUT) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.durationTooLong', { max: (0, time_1.formatDuration)(time_1.MAX_TIMEOUT) })), true);
            return;
        }
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.memberNotFound')), true);
            return;
        }
        if (!(await (0, actions_1.ensureTargetAllowed)(interaction, member, t)))
            return;
        await interaction.deferReply();
        try {
            await member.timeout(durationMs, `${interaction.user.tag}: ${reason ?? t('common.noReason')}`);
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })));
            return;
        }
        await (0, actions_1.dmPunishment)(user, guild, 'timeout', reason, durationMs, t, settings);
        const modCase = await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'timeout',
            userId: user.id,
            userTag: user.tag,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason,
            durationMs,
        }, t);
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.timedOut', {
            user: user.tag,
            duration: (0, time_1.formatDuration)(durationMs),
            case: modCase.case_number,
        })));
    },
});
//# sourceMappingURL=timeout.js.map