"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logging_1 = require("../modules/logging");
const guilds_1 = require("../db/guilds");
const i18n_1 = require("../i18n");
const embeds_1 = require("../utils/embeds");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.MessageDelete, async (_client, message) => {
    if (!message.guild)
        return;
    if (message.partial && !message.author)
        return;
    if (message.author?.bot)
        return;
    const settings = (0, guilds_1.getSettings)(message.guild.id);
    const t = (0, i18n_1.createTranslator)(settings.locale);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.danger)
        .setTitle(`🗑️ ${t('log.messageDeleted')}`)
        .addFields({
        name: t('log.author'),
        value: message.author ? `<@${message.author.id}>\n\`${message.author.id}\`` : t('common.none'),
        inline: true,
    }, { name: t('common.channel'), value: `<#${message.channelId}>`, inline: true }, { name: t('log.content'), value: (0, embeds_1.truncate)(message.content || t('log.empty')) })
        .setTimestamp();
    if (message.attachments?.size) {
        embed.addFields({
            name: t('log.attachments'),
            value: (0, embeds_1.truncate)(message.attachments.map((file) => file.name).join('\n'), 500),
        });
    }
    await (0, logging_1.sendLog)(message.guild, 'message', embed);
});
//# sourceMappingURL=messageDelete.js.map