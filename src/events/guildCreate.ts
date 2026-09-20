import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { createLogger } from '../core/logger';
import { ensureGuild } from '../db/guilds';

const log = createLogger('guild');

export default defineEvent(Events.GuildCreate, async (client, guild) => {
  await ensureGuild(guild.id, {
    name: guild.name,
    icon: guild.iconURL({ size: 128 }),
    memberCount: guild.memberCount,
  });
  log.info(`Yangi serverga qo'shildim: ${guild.name} (${guild.id}) — ${guild.memberCount} a'zo`);
  log.info(`Jami serverlar: ${client.guilds.cache.size}`);
});
