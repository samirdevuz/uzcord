import { ActivityType, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { createLogger } from '../core/logger';
import { ensureGuild } from '../db/guilds';
import { startScheduler } from '../core/scheduler';

const log = createLogger('ready');

export default defineEvent(
  Events.ClientReady,
  async (client) => {
    log.info(`${client.user?.tag} tizimga kirdi.`);
    log.info(`Serverlar: ${client.guilds.cache.size} · Komandalar: ${client.commands.size}`);

    // Bot turgan har bir server uchun bazada yozuv borligiga ishonch hosil
    // qilamiz va dashboard uchun nom/ikonkani yangilaymiz.
    for (const guild of client.guilds.cache.values()) {
      await ensureGuild(guild.id, {
        name: guild.name,
        icon: guild.iconURL({ size: 128 }),
        memberCount: guild.memberCount,
      }).catch(() => null);
    }

    client.user?.setPresence({
      status: 'online',
      activities: [{ name: "/help · uzcord.samirdev.uz", type: ActivityType.Watching }],
    });

    startScheduler(client);
  },
  true
);
