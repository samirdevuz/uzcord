import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { scheduleStructureSync } from '../modules/structure';

/** Dashboard'dagi kanal/rol ro'yxatini yangilab turadi. */
export default defineEvent(Events.GuildRoleUpdate, (_client, _old, role) => {
  const guild = role.guild;
  if (guild) scheduleStructureSync(guild);
});
