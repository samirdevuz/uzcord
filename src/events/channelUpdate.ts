import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { scheduleStructureSync } from '../modules/structure';

/** Dashboard'dagi kanal/rol ro'yxatini yangilab turadi. */
export default defineEvent(Events.ChannelUpdate, (_client, _old, channel) => {
  const guild = 'guild' in channel ? channel.guild : null;
  if (guild) scheduleStructureSync(guild);
});
