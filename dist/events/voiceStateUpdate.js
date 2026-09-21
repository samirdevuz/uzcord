"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logging_1 = require("../modules/logging");
const guilds_1 = require("../db/guilds");
const i18n_1 = require("../i18n");
const embeds_1 = require("../utils/embeds");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.VoiceStateUpdate, async (_client, oldState, newState) => {
    const guild = newState.guild ?? oldState.guild;
    if (!guild)
        return;
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot)
        return;
    const settings = (0, guilds_1.getSettings)(guild.id);
    const t = (0, i18n_1.createTranslator)(settings.locale);
    const embed = new discord_js_1.EmbedBuilder().setTimestamp().addFields({
        name: t('common.user'),
        value: `<@${member.id}>`,
        inline: true,
    });
    if (!oldState.channelId && newState.channelId) {
        embed
            .setColor(embeds_1.COLORS.success)
            .setTitle(`🔊 ${t('log.voiceJoin')}`)
            .addFields({ name: t('common.channel'), value: `<#${newState.channelId}>`, inline: true });
    }
    else if (oldState.channelId && !newState.channelId) {
        embed
            .setColor(embeds_1.COLORS.danger)
            .setTitle(`🔇 ${t('log.voiceLeave')}`)
            .addFields({ name: t('common.channel'), value: `<#${oldState.channelId}>`, inline: true });
    }
    else if (oldState.channelId !== newState.channelId) {
        embed
            .setColor(embeds_1.COLORS.info)
            .setTitle(`🔁 ${t('log.voiceMove')}`)
            .addFields({ name: t('log.before'), value: `<#${oldState.channelId}>`, inline: true }, { name: t('log.after'), value: `<#${newState.channelId}>`, inline: true });
    }
    else {
        // Mute/deafen kabi o'zgarishlar loglanmaydi — shovqin bo'lmasligi uchun.
        return;
    }
    await (0, logging_1.sendLog)(guild, 'voice', embed);
});
//# sourceMappingURL=voiceStateUpdate.js.map