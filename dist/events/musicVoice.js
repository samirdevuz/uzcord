"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const player_1 = require("../modules/music/player");
/** Bot yolg'iz qolsa yoki kanaldan chiqarib yuborilsa, pleyerni tozalaydi. */
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.VoiceStateUpdate, (client, oldState, newState) => {
    const guild = newState.guild ?? oldState.guild;
    const player = (0, player_1.findGuildPlayer)(guild.id);
    if (!player)
        return;
    // Botning o'zi kanaldan chiqarildi.
    if (newState.id === client.user?.id && !newState.channelId) {
        player.destroy();
        return;
    }
    const channelId = player.channelId;
    if (!channelId || (oldState.channelId !== channelId && newState.channelId !== channelId))
        return;
    const channel = guild.channels.cache.get(channelId);
    if (!channel?.isVoiceBased())
        return;
    const listeners = channel.members.filter((member) => !member.user.bot).size;
    if (listeners === 0)
        player.scheduleEmptyLeave();
    else
        player.cancelEmptyLeave();
});
//# sourceMappingURL=musicVoice.js.map