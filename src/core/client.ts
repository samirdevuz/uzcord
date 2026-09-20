import { Client, Collection, GatewayIntentBits, Options, Partials } from 'discord.js';
import type { Command } from './types';
import { createLogger, type Logger } from './logger';

export class UzCordClient extends Client {
  public readonly commands = new Collection<string, Command>();
  /** commandName -> (userId -> keyingi ishlatish mumkin bo'lgan vaqt) */
  public readonly cooldowns = new Collection<string, Collection<string, number>>();
  public readonly log: Logger = createLogger('client');

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // privileged — portalda yoqilishi shart
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // privileged — automod uchun shart
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.User,
      ],
      allowedMentions: { parse: ['users'], repliedUser: false },
      // Keraksiz keshlarni cheklash — xotirani tejaydi.
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        MessageManager: 200,
        PresenceManager: 0,
        ReactionManager: 0,
      }),
    });
  }
}
