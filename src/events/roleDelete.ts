import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { logStructureChange } from '../modules/logging';
import { scheduleStructureSync } from '../modules/structure';

export default defineEvent(Events.GuildRoleDelete, async (_client, role) => {
  scheduleStructureSync(role.guild);
  await logStructureChange(role.guild, 'log.roleDeleted', { id: role.id, name: role.name });
});
