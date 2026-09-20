import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { createLogger } from '../core/logger';
import { markBotLeft } from '../db/guilds';

const log = createLogger('guild');

export default defineEvent(Events.GuildDelete, async (client, guild) => {
  await markBotLeft(guild.id);
  // Ma'lumotlarni saqlab qolamiz: bot qayta qo'shilsa sozlamalar joyida bo'ladi.
  // Butunlay o'chirish kerak bo'lsa: purgeGuild(guild.id)
  log.info(`Serverdan chiqarildim: ${guild.name} (${guild.id})`);
  log.info(`Jami serverlar: ${client.guilds.cache.size}`);
});
