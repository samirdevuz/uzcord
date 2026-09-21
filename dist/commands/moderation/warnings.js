"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const cases_1 = require("../../db/cases");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('warnings')
        .setDescription("Foydalanuvchining faol ogohlantirishlarini ko'rsatadi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addUserOption((option) => option.setName('user').setDescription("Foydalanuvchi").setRequired(true)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const user = interaction.options.getUser('user', true);
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const warnings = await (0, cases_1.getActiveWarnings)(interaction.guildId, user.id);
        const embed = (0, embeds_1.infoEmbed)(undefined, t('mod.warningsTitle', { user: user.tag })).setThumbnail(user.displayAvatarURL());
        if (warnings.length === 0) {
            embed.setDescription(t('error.noWarnings', { user: user.tag }));
            await (0, actions_1.reply)(interaction, embed, true);
            return;
        }
        embed.setDescription(`${t('common.total')}: **${warnings.length}**`);
        for (const warning of warnings.slice(0, 15)) {
            embed.addFields({
                name: `#${warning.case_number} — ${(0, time_1.shortDate)(warning.created_at)}`,
                value: (0, embeds_1.truncate)(`${t('common.moderator')}: <@${warning.moderator_id}>\n` +
                    `${t('common.reason')}: ${warning.reason ?? t('common.noReason')}`, 300),
            });
        }
        if (warnings.length > 15) {
            embed.setFooter({ text: `+${warnings.length - 15} ta yana` });
        }
        await (0, actions_1.reply)(interaction, embed, true);
    },
});
//# sourceMappingURL=warnings.js.map