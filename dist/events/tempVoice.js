"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
// Voice channel creation trigger names
const TRIGGER_NAMES = ['join-to-create', 'voice-yaratish', '+ create voice'];
// Track created temporary channels
const tempChannels = new Set();
exports.default = (0, types_1.defineEvent)('voiceStateUpdate', async (client, oldState, newState) => {
    const guild = newState.guild ?? oldState.guild;
    if (!guild)
        return;
    // Member joined a trigger channel
    if (newState.channelId && newState.channel) {
        const isTrigger = TRIGGER_NAMES.some((name) => newState.channel.name.toLowerCase().includes(name));
        if (isTrigger && newState.member) {
            const category = newState.channel.parentId;
            const createdChannel = await guild.channels.create({
                name: `🔊 ${newState.member.displayName} kanali`,
                type: discord_js_1.ChannelType.GuildVoice,
                parent: category ?? undefined,
                permissionOverwrites: [
                    {
                        id: newState.member.id,
                        allow: [discord_js_1.PermissionFlagsBits.ManageChannels, discord_js_1.PermissionFlagsBits.MoveMembers],
                    },
                ],
            }).catch(() => null);
            if (createdChannel) {
                tempChannels.add(createdChannel.id);
                await newState.member.voice.setChannel(createdChannel).catch(() => null);
            }
        }
    }
    // Member left a temporary channel - if empty, delete it
    if (oldState.channelId && oldState.channel && tempChannels.has(oldState.channelId)) {
        if (oldState.channel.members.size === 0) {
            tempChannels.delete(oldState.channelId);
            await oldState.channel.delete('Temp voice empty').catch(() => null);
        }
    }
});
//# sourceMappingURL=tempVoice.js.map