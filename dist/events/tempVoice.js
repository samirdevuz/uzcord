"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('tempvoice');
/** Shu nomli ovozli kanalga kirgan a'zoga shaxsiy kanal ochiladi. */
const TRIGGER_NAMES = ['join-to-create', 'voice-yaratish', '+ create voice', '➕ kanal yaratish'];
const TEMP_PREFIX = '🔊 ';
const TEMP_SUFFIX = ' kanali';
/** Bot yaratgan kanallar. Qayta ishga tushganda nom bo'yicha ham taniladi. */
const tempChannels = new Set();
function isTrigger(channel) {
    const name = channel.name.toLowerCase();
    return TRIGGER_NAMES.some((trigger) => name.includes(trigger));
}
function isTemp(channel) {
    return tempChannels.has(channel.id) || (channel.name.startsWith(TEMP_PREFIX) && channel.name.endsWith(TEMP_SUFFIX));
}
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.VoiceStateUpdate, async (_client, oldState, newState) => {
    const guild = newState.guild ?? oldState.guild;
    const me = guild.members.me;
    if (!me?.permissions.has([discord_js_1.PermissionFlagsBits.ManageChannels, discord_js_1.PermissionFlagsBits.MoveMembers]))
        return;
    // Trigger kanalga kirdi — shaxsiy kanal ochamiz.
    const joined = newState.channel;
    if (joined && newState.member && !newState.member.user.bot && isTrigger(joined) && joined.id !== oldState.channelId) {
        const member = newState.member;
        const created = await guild.channels
            .create({
            name: `${TEMP_PREFIX}${member.displayName}${TEMP_SUFFIX}`.slice(0, 100),
            type: discord_js_1.ChannelType.GuildVoice,
            parent: joined.parentId ?? undefined,
            bitrate: joined.bitrate,
            userLimit: joined.userLimit,
            permissionOverwrites: [
                ...joined.permissionOverwrites.cache.values(),
                {
                    id: member.id,
                    allow: [discord_js_1.PermissionFlagsBits.ManageChannels, discord_js_1.PermissionFlagsBits.MoveMembers, discord_js_1.PermissionFlagsBits.MuteMembers],
                },
            ],
            reason: `Vaqtinchalik kanal: ${member.user.tag}`,
        })
            .catch((error) => {
            log.warn(`Vaqtinchalik kanal yaratilmadi (${guild.id}):`, error);
            return null;
        });
        if (created) {
            tempChannels.add(created.id);
            await member.voice.setChannel(created).catch(() => created.delete().catch(() => null));
        }
    }
    // Vaqtinchalik kanal bo'shab qoldi — o'chiramiz.
    const left = oldState.channel;
    if (left && left.id !== newState.channelId && isTemp(left) && left.members.size === 0) {
        tempChannels.delete(left.id);
        await left.delete("Vaqtinchalik kanal bo'sh qoldi").catch(() => null);
    }
});
//# sourceMappingURL=tempVoice.js.map