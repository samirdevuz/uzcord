"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const engine_1 = require("../modules/automod/engine");
const welcome_1 = require("../modules/welcome");
const logging_1 = require("../modules/logging");
const guilds_1 = require("../db/guilds");
const i18n_1 = require("../i18n");
const embeds_1 = require("../utils/embeds");
const time_1 = require("../utils/time");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildMemberAdd, async (_client, member) => {
    // Avval xavfsizlik tekshiruvi: a'zo chiqarilsa, qolgan amallar bajarilmaydi.
    const removed = await (0, engine_1.inspectJoin)(member);
    if (removed)
        return;
    const settings = (0, guilds_1.getSettings)(member.guild.id);
    const t = (0, i18n_1.createTranslator)(settings.locale);
    await (0, logging_1.sendLog)(member.guild, 'member', new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.success)
        .setTitle(`📥 ${t('log.memberJoined')}`)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields({ name: t('common.user'), value: `<@${member.id}>\n\`${member.id}\``, inline: true }, {
        name: t('log.accountCreated'),
        value: `${(0, time_1.fullDate)(member.user.createdTimestamp)}\n${(0, time_1.relative)(member.user.createdTimestamp)}`,
        inline: true,
    })
        .setFooter({ text: t('log.memberCount', { count: member.guild.memberCount }) })
        .setTimestamp());
    await (0, welcome_1.handleJoin)(member);
});
//# sourceMappingURL=guildMemberAdd.js.map