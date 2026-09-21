"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.ModerateMembers],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('untimeout')
        .setDescription("A'zoning timeoutini olib tashlaydi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addUserOption((option) => option.setName('user').setDescription("A'zo").setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription("Sabab").setMaxLength(400)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason');
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.memberNotFound')), true);
            return;
        }
        if (!member.isCommunicationDisabled()) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.notTimedOut')), true);
            return;
        }
        if (!(await (0, actions_1.ensureTargetAllowed)(interaction, member, t)))
            return;
        await interaction.deferReply();
        try {
            await member.timeout(null, `${interaction.user.tag}: ${reason ?? t('common.noReason')}`);
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })));
            return;
        }
        const modCase = await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'untimeout',
            userId: user.id,
            userTag: user.tag,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason,
        }, t);
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.timeoutRemoved', { user: user.tag, case: modCase.case_number })));
    },
});
//# sourceMappingURL=untimeout.js.map