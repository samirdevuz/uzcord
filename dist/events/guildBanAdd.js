"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logging_1 = require("../modules/logging");
const guilds_1 = require("../db/guilds");
const i18n_1 = require("../i18n");
const embeds_1 = require("../utils/embeds");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildBanAdd, async (client, ban) => {
    const settings = (0, guilds_1.getSettings)(ban.guild.id);
    const t = (0, i18n_1.createTranslator)(settings.locale);
    // Kim ban qilganini audit logdan topamiz (bot o'zi qilgan bo'lsa — yozmaymiz,
    // chunki u allaqachon case sifatida loglangan).
    const entry = await ban.guild
        .fetchAuditLogs({ type: discord_js_1.AuditLogEvent.MemberBanAdd, limit: 5 })
        .then((logs) => logs.entries.find((item) => item.target?.id === ban.user.id))
        .catch(() => null);
    if (entry?.executor?.id === client.user?.id)
        return;
    await (0, logging_1.sendLog)(ban.guild, 'member', new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.danger)
        .setTitle(`🔨 ${t('log.banAdded')}`)
        .setThumbnail(ban.user.displayAvatarURL())
        .addFields({ name: t('common.user'), value: `${ban.user.tag}\n\`${ban.user.id}\``, inline: true }, {
        name: t('common.moderator'),
        value: entry?.executor ? `<@${entry.executor.id}>` : t('common.none'),
        inline: true,
    }, {
        name: t('common.reason'),
        value: (0, embeds_1.truncate)(entry?.reason ?? ban.reason ?? t('common.noReason')),
    })
        .setTimestamp());
});
//# sourceMappingURL=guildBanAdd.js.map