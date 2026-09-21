"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logging_1 = require("../modules/logging");
const guilds_1 = require("../db/guilds");
const i18n_1 = require("../i18n");
const embeds_1 = require("../utils/embeds");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildMemberUpdate, async (_client, oldMember, newMember) => {
    const settings = (0, guilds_1.getSettings)(newMember.guild.id);
    const t = (0, i18n_1.createTranslator)(settings.locale);
    // Nickname o'zgarishi
    if (oldMember.nickname !== newMember.nickname) {
        await (0, logging_1.sendLog)(newMember.guild, 'member', new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.info)
            .setTitle(`📝 ${t('log.nicknameChanged')}`)
            .addFields({ name: t('common.user'), value: `<@${newMember.id}>`, inline: true }, { name: t('log.before'), value: oldMember.nickname ?? t('common.none'), inline: true }, { name: t('log.after'), value: newMember.nickname ?? t('common.none'), inline: true })
            .setTimestamp());
    }
    // Rollar o'zgarishi
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    const added = newRoles.filter((role) => !oldRoles.has(role.id));
    const removed = oldRoles.filter((role) => !newRoles.has(role.id));
    if (added.size > 0 || removed.size > 0) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.purple)
            .setTitle(`🎭 ${t('log.rolesChanged')}`)
            .addFields({ name: t('common.user'), value: `<@${newMember.id}>` })
            .setTimestamp();
        if (added.size > 0) {
            embed.addFields({
                name: `➕ ${t('log.rolesAdded')}`,
                value: (0, embeds_1.truncate)(added.map((role) => `<@&${role.id}>`).join(' '), 800),
            });
        }
        if (removed.size > 0) {
            embed.addFields({
                name: `➖ ${t('log.rolesRemoved')}`,
                value: (0, embeds_1.truncate)(removed.map((role) => `<@&${role.id}>`).join(' '), 800),
            });
        }
        await (0, logging_1.sendLog)(newMember.guild, 'member', embed);
    }
});
//# sourceMappingURL=guildMemberUpdate.js.map