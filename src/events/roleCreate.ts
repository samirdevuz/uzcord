import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { logStructureChange } from '../modules/logging';
import { scheduleStructureSync } from '../modules/structure';

export default defineEvent(Events.GuildRoleCreate, async (_client, role) => {
  scheduleStructureSync(role.guild);
  await logStructureChange(role.guild, 'log.roleCreated', { id: role.id, name: role.name, mention: `<@&${role.id}>` });
});
