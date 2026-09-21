"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const cases_1 = require("../../db/cases");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('userinfo')
        .setDescription("Foydalanuvchi haqida ma'lumot beradi")
        .setDMPermission(false)
        .addUserOption((option) => option.setName('user').setDescription("Foydalanuvchi (bo'sh = o'zingiz)")),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const user = interaction.options.getUser('user') ?? interaction.user;
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        const embed = (0, embeds_1.brandEmbed)(t('util.userInfoTitle', { user: user.tag }))
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields({ name: 'ID', value: `\`${user.id}\``, inline: true }, { name: t('util.bot'), value: user.bot ? '✅' : '❌', inline: true }, { name: t('util.createdAt'), value: (0, time_1.fullDate)(user.createdTimestamp), inline: true });
        if (member) {
            const roles = member.roles.cache
                .filter((role) => role.id !== interaction.guildId)
                .sort((a, b) => b.position - a.position)
                .map((role) => `<@&${role.id}>`);
            embed.addFields({
                name: t('util.nickname'),
                value: member.nickname ?? t('common.none'),
                inline: true,
            }, {
                name: t('log.joinedAt'),
                value: member.joinedTimestamp ? (0, time_1.fullDate)(member.joinedTimestamp) : t('common.none'),
                inline: true,
            }, {
                name: t('util.highestRole'),
                value: `<@&${member.roles.highest.id}>`,
                inline: true,
            }, {
                name: `${t('util.roles')} (${roles.length})`,
                value: roles.length > 0 ? (0, embeds_1.truncate)(roles.join(' '), 1000) : t('common.none'),
            });
            if (member.communicationDisabledUntilTimestamp) {
                embed.addFields({
                    name: t('util.timedOutUntil'),
                    value: (0, time_1.relative)(member.communicationDisabledUntilTimestamp),
                    inline: true,
                });
            }
            const warnings = await (0, cases_1.countActiveWarnings)(interaction.guildId, user.id);
            if (warnings > 0) {
                embed.addFields({ name: '⚠️ Ogohlantirishlar', value: String(warnings), inline: true });
            }
        }
        await (0, actions_1.reply)(interaction, embed);
    },
});
//# sourceMappingURL=userinfo.js.map