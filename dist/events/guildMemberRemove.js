"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const welcome_1 = require("../modules/welcome");
const logging_1 = require("../modules/logging");
const guilds_1 = require("../db/guilds");
const i18n_1 = require("../i18n");
const embeds_1 = require("../utils/embeds");
const time_1 = require("../utils/time");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildMemberRemove, async (_client, member) => {
    const settings = (0, guilds_1.getSettings)(member.guild.id);
    const t = (0, i18n_1.createTranslator)(settings.locale);
    const roles = member.roles?.cache
        .filter((role) => role.id !== member.guild.id)
        .map((role) => `<@&${role.id}>`);
    await (0, logging_1.sendLog)(member.guild, 'member', new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.danger)
        .setTitle(`📤 ${t('log.memberLeft')}`)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields({ name: t('common.user'), value: `<@${member.id}>\n\`${member.id}\``, inline: true }, {
        name: t('log.joinedAt'),
        value: member.joinedTimestamp ? (0, time_1.fullDate)(member.joinedTimestamp) : t('common.none'),
        inline: true,
    }, {
        name: t('util.roles'),
        value: roles && roles.length > 0 ? (0, embeds_1.truncate)(roles.join(' '), 800) : t('common.none'),
    })
        .setFooter({ text: t('log.memberCount', { count: member.guild.memberCount }) })
        .setTimestamp());
    await (0, welcome_1.handleLeave)(member);
});
//# sourceMappingURL=guildMemberRemove.js.map