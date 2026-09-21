"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const cases_1 = require("../../db/cases");
const actions_1 = require("../../modules/moderation/actions");
const escalation_1 = require("../../modules/moderation/escalation");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.ModerateMembers],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('warn')
        .setDescription("A'zoni ogohlantiradi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addUserOption((option) => option.setName('user').setDescription("Ogohlantiriladigan a'zo").setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription("Sabab").setRequired(true).setMaxLength(400)),
    async execute(interaction, ctx) {
        const { t, settings } = ctx;
        const guild = interaction.guild;
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason', true);
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.memberNotFound')), true);
            return;
        }
        if (!(await (0, actions_1.ensureTargetAllowed)(interaction, member, t)))
            return;
        await interaction.deferReply();
        const modCase = await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'warn',
            userId: user.id,
            userTag: user.tag,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason,
        }, t);
        await (0, actions_1.dmPunishment)(user, guild, 'warn', reason, null, t, settings);
        const count = await (0, cases_1.countActiveWarnings)(guild.id, user.id);
        const embed = (0, embeds_1.successEmbed)(t('mod.warned', { user: user.tag, count, case: modCase.case_number }));
        const escalated = await (0, escalation_1.applyEscalation)(guild, member, count, t, settings);
        if (escalated) {
            embed.setFooter({ text: t('mod.escalation', { count, action: escalated }) });
        }
        await (0, actions_1.reply)(interaction, embed);
    },
});
//# sourceMappingURL=warn.js.map