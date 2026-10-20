import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { logStructureChange } from '../modules/logging';
import { scheduleStructureSync } from '../modules/structure';

export default defineEvent(Events.ChannelCreate, async (_client, channel) => {
  scheduleStructureSync(channel.guild);
  await logStructureChange(channel.guild, 'log.channelCreated', { id: channel.id, name: channel.name, mention: `<#${channel.id}>` });
});
