import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { ensureGuild } from '../db/guilds';

/** Server nomi yoki ikonkasi o'zgarsa, dashboard'dagi ma'lumotni yangilaydi. */
export default defineEvent(Events.GuildUpdate, async (_client, oldGuild, guild) => {
  if (oldGuild.name === guild.name && oldGuild.icon === guild.icon) return;
  await ensureGuild(guild.id, { name: guild.name, icon: guild.iconURL({ size: 128 }), memberCount: guild.memberCount });
});
