"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.KickMembers],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('kick')
        .setDescription("A'zoni serverdan chiqaradi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers)
        .setDMPermission(false)
        .addUserOption((option) => option.setName('user').setDescription("Chiqariladigan a'zo").setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription("Sabab").setMaxLength(400)),
    async execute(interaction, ctx) {
        const { t, settings } = ctx;
        const guild = interaction.guild;
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason');
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.memberNotFound')), true);
            return;
        }
        if (!(await (0, actions_1.ensureTargetAllowed)(interaction, member, t)))
            return;
        await interaction.deferReply();
        await (0, actions_1.dmPunishment)(user, guild, 'kick', reason, null, t, settings);
        try {
            await member.kick(`${interaction.user.tag}: ${reason ?? t('common.noReason')}`);
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })));
            return;
        }
        const modCase = await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'kick',
            userId: user.id,
            userTag: user.tag,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason,
        }, t);
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.kicked', { user: user.tag, case: modCase.case_number })));
    },
});
//# sourceMappingURL=kick.js.map