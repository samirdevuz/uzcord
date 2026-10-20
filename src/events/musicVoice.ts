import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { findGuildPlayer } from '../modules/music/player';

/** Bot yolg'iz qolsa yoki kanaldan chiqarib yuborilsa, pleyerni tozalaydi. */
export default defineEvent(Events.VoiceStateUpdate, (client, oldState, newState) => {
  const guild = newState.guild ?? oldState.guild;
  const player = findGuildPlayer(guild.id);
  if (!player) return;

  // Botning o'zi kanaldan chiqarildi.
  if (newState.id === client.user?.id && !newState.channelId) {
    player.destroy();
    return;
  }

  const channelId = player.channelId;
  if (!channelId || (oldState.channelId !== channelId && newState.channelId !== channelId)) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel?.isVoiceBased()) return;
  const listeners = channel.members.filter((member) => !member.user.bot).size;
  if (listeners === 0) player.scheduleEmptyLeave();
  else player.cancelEmptyLeave();
});
