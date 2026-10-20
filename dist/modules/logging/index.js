"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLog = sendLog;
exports.logStructureChange = logStructureChange;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const i18n_1 = require("../../i18n");
const embeds_1 = require("../../utils/embeds");
const log = (0, logger_1.createLogger)('logging');
/**
 * Log embedini serverning tegishli log kanaliga yuboradi.
 * Kanal sozlanmagan, topilmagan yoki ruxsat yetmasa — jimgina to'xtaydi.
 */
async function sendLog(guild, kind, embed) {
    try {
        const settings = (0, guilds_1.getSettings)(guild.id);
        if (!(0, guilds_1.isModuleEnabled)(settings, 'logging'))
            return;
        const channelId = settings[guilds_1.LOG_COLUMNS[kind]];
        if (!channelId)
            return;
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
            return;
        const me = guild.members.me;
        if (!me)
            return;
        const permissions = channel.permissionsFor(me);
        if (!permissions?.has(discord_js_1.PermissionFlagsBits.ViewChannel) ||
            !permissions.has(discord_js_1.PermissionFlagsBits.SendMessages) ||
            !permissions.has(discord_js_1.PermissionFlagsBits.EmbedLinks)) {
            return;
        }
        await channel.send({ embeds: [embed] });
    }
    catch (error) {
        log.warn(`Log yuborilmadi (${guild.id}/${kind}):`, error);
    }
}
/** Kanal/rol yaratilishi va o'chirilishi — "server" log kanaliga. */
async function logStructureChange(guild, key, target) {
    const t = (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(guild.id).locale);
    const created = key.endsWith('Created');
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(created ? embeds_1.COLORS.success : embeds_1.COLORS.danger)
        .setTitle(`${created ? '➕' : '➖'} ${t(key)}`)
        .addFields({ name: t('log.name'), value: target.mention && created ? `${target.mention} (${target.name})` : target.name, inline: true }, { name: 'ID', value: `\`${target.id}\``, inline: true })
        .setTimestamp();
    await sendLog(guild, 'server', embed);
}
//# sourceMappingURL=index.js.map