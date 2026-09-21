"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_GOODBYE = exports.DEFAULT_WELCOME = void 0;
exports.renderTemplate = renderTemplate;
exports.handleJoin = handleJoin;
exports.handleLeave = handleLeave;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const embeds_1 = require("../../utils/embeds");
const log = (0, logger_1.createLogger)('welcome');
exports.DEFAULT_WELCOME = "Xush kelibsiz, {user}! **{server}** serveriga qo'shildingiz. Endi bizda {memberCount} ta a'zo bor.";
exports.DEFAULT_GOODBYE = "**{user.tag}** serverdan chiqdi. Endi {memberCount} ta a'zo qoldi.";
/** Shablondagi {user}, {server} kabi joylarni haqiqiy qiymatlar bilan almashtiradi. */
function renderTemplate(template, member) {
    return template
        .replace(/\{user\.tag\}/g, member.user.tag)
        .replace(/\{user\.name\}/g, member.user.username)
        .replace(/\{user\.id\}/g, member.id)
        .replace(/\{user\}/g, `<@${member.id}>`)
        .replace(/\{server\}/g, member.guild.name)
        .replace(/\{memberCount\}/g, String(member.guild.memberCount));
}
async function post(member, channelId, text) {
    const channel = await member.guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== discord_js_1.ChannelType.GuildText)
        return;
    const me = member.guild.members.me;
    if (!me)
        return;
    const permissions = channel.permissionsFor(me);
    if (!permissions?.has(discord_js_1.PermissionFlagsBits.SendMessages))
        return;
    if (permissions.has(discord_js_1.PermissionFlagsBits.EmbedLinks)) {
        await channel.send({
            embeds: [(0, embeds_1.brandEmbed)(undefined, text).setThumbnail(member.user.displayAvatarURL())],
        });
    }
    else {
        await channel.send({ content: text });
    }
}
async function handleJoin(member) {
    const settings = (0, guilds_1.getSettings)(member.guild.id);
    if (!(0, guilds_1.isModuleEnabled)(settings, 'welcome'))
        return;
    if (settings.welcome_channel_id) {
        try {
            await post(member, settings.welcome_channel_id, renderTemplate(settings.welcome_message ?? exports.DEFAULT_WELCOME, member));
        }
        catch (error) {
            log.warn('Xush kelibsiz xabari yuborilmadi:', error);
        }
    }
    if (settings.autorole_id) {
        try {
            const role = member.guild.roles.cache.get(settings.autorole_id);
            const me = member.guild.members.me;
            if (role && me && !role.managed && me.roles.highest.comparePositionTo(role) > 0) {
                await member.roles.add(role, 'Avtomatik rol (autorole)');
            }
        }
        catch (error) {
            log.warn('Avtomatik rol berilmadi:', error);
        }
    }
}
async function handleLeave(member) {
    const settings = (0, guilds_1.getSettings)(member.guild.id);
    if (!(0, guilds_1.isModuleEnabled)(settings, 'welcome'))
        return;
    if (!settings.goodbye_channel_id)
        return;
    try {
        await post(member, settings.goodbye_channel_id, renderTemplate(settings.goodbye_message ?? exports.DEFAULT_GOODBYE, member));
    }
    catch (error) {
        log.warn('Xayrlashuv xabari yuborilmadi:', error);
    }
}
//# sourceMappingURL=index.js.map