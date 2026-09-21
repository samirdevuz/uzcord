"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const cases_1 = require("../../db/cases");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.BanMembers],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('unban')
        .setDescription("Foydalanuvchining banini olib tashlaydi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers)
        .setDMPermission(false)
        .addStringOption((option) => option
        .setName('user_id')
        .setDescription("Ban olib tashlanadigan foydalanuvchining ID si")
        .setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription("Sabab").setMaxLength(400)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const userId = interaction.options.getString('user_id', true).replace(/\D/g, '');
        const reason = interaction.options.getString('reason');
        if (!userId) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.userNotFound')), true);
            return;
        }
        await interaction.deferReply();
        const ban = await guild.bans.fetch(userId).catch(() => null);
        if (!ban) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.notBanned')));
            return;
        }
        try {
            await guild.bans.remove(userId, `${interaction.user.tag}: ${reason ?? t('common.noReason')}`);
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })));
            return;
        }
        await (0, cases_1.removeTempActionFor)(guild.id, userId, 'ban');
        const modCase = await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'unban',
            userId,
            userTag: ban.user.tag,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason,
        }, t);
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.unbanned', { user: ban.user.tag, case: modCase.case_number })));
    },
});
//# sourceMappingURL=unban.js.map