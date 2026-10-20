import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { logStructureChange } from '../modules/logging';
import { scheduleStructureSync } from '../modules/structure';

export default defineEvent(Events.ChannelDelete, async (_client, channel) => {
  if (!('guild' in channel) || !channel.guild) return;
  scheduleStructureSync(channel.guild);
  await logStructureChange(channel.guild, 'log.channelDeleted', { id: channel.id, name: channel.name });
});
