"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeChannels = serializeChannels;
exports.serializeRoles = serializeRoles;
exports.syncGuildStructure = syncGuildStructure;
exports.scheduleStructureSync = scheduleStructureSync;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const supabase_1 = require("../../db/supabase");
const log = (0, logger_1.createLogger)('structure');
/** Dashboard'da tanlash mumkin bo'lgan kanal turlari. */
const CHANNEL_TYPES = new Set([
    discord_js_1.ChannelType.GuildText,
    discord_js_1.ChannelType.GuildVoice,
    discord_js_1.ChannelType.GuildCategory,
    discord_js_1.ChannelType.GuildAnnouncement,
    discord_js_1.ChannelType.GuildStageVoice,
    discord_js_1.ChannelType.GuildForum,
]);
function serializeChannels(guild) {
    return [...guild.channels.cache.values()]
        .filter((channel) => CHANNEL_TYPES.has(channel.type))
        .map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parent_id: 'parentId' in channel ? channel.parentId : null,
        position: 'rawPosition' in channel ? channel.rawPosition : 0,
    }))
        .sort((a, b) => a.position - b.position);
}
function serializeRoles(guild) {
    return [...guild.roles.cache.values()]
        .filter((role) => role.id !== guild.id) // @everyone
        .map((role) => ({ id: role.id, name: role.name, color: role.color, position: role.position, managed: role.managed }))
        .sort((a, b) => b.position - a.position);
}
const pending = new Map();
const DEBOUNCE_MS = 5000;
async function syncGuildStructure(guild) {
    const { error } = await supabase_1.supabase
        .from('guilds')
        .update({
        channels: serializeChannels(guild),
        roles: serializeRoles(guild),
        structure_synced: new Date().toISOString(),
    })
        .eq('guild_id', guild.id);
    if (error)
        log.warn(`Tuzilmani yozib bo'lmadi (${guild.id}): ${error.message}`);
}
/**
 * Kanal/rol o'zgarishlari ko'pincha ketma-ket keladi (masalan, kategoriya
 * ko'chirilganda) — shuning uchun 5 soniya jimlikdan keyin bir marta yoziladi.
 */
function scheduleStructureSync(guild) {
    const existing = pending.get(guild.id);
    if (existing)
        clearTimeout(existing);
    const timer = setTimeout(() => {
        pending.delete(guild.id);
        void syncGuildStructure(guild);
    }, DEBOUNCE_MS);
    timer.unref();
    pending.set(guild.id, timer);
}
//# sourceMappingURL=index.js.map