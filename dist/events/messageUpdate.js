"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logging_1 = require("../modules/logging");
const guilds_1 = require("../db/guilds");
const engine_1 = require("../modules/automod/engine");
const i18n_1 = require("../i18n");
const embeds_1 = require("../utils/embeds");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.MessageUpdate, async (_client, oldMessage, newMessage) => {
    if (!newMessage.guild)
        return;
    if (newMessage.author?.bot)
        return;
    if (oldMessage.content === newMessage.content)
        return;
    // Tahrirlangan xabar ham AutoMod tekshiruvidan o'tadi.
    const full = newMessage.partial ? await newMessage.fetch().catch(() => null) : newMessage;
    if (full)
        await (0, engine_1.inspectMessage)(full);
    const settings = (0, guilds_1.getSettings)(newMessage.guild.id);
    const t = (0, i18n_1.createTranslator)(settings.locale);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.warning)
        .setTitle(`✏️ ${t('log.messageEdited')}`)
        .addFields({
        name: t('log.author'),
        value: newMessage.author
            ? `<@${newMessage.author.id}>\n\`${newMessage.author.id}\``
            : t('common.none'),
        inline: true,
    }, { name: t('common.channel'), value: `<#${newMessage.channelId}>`, inline: true }, { name: t('log.before'), value: (0, embeds_1.truncate)(oldMessage.content || t('log.empty')) }, { name: t('log.after'), value: (0, embeds_1.truncate)(newMessage.content || t('log.empty')) })
        .setTimestamp();
    if (newMessage.url) {
        embed.setDescription(`[${t('log.jumpToMessage')}](${newMessage.url})`);
    }
    await (0, logging_1.sendLog)(newMessage.guild, 'message', embed);
});
//# sourceMappingURL=messageUpdate.js.map