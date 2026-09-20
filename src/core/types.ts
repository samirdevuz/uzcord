import type {
  ChatInputCommandInteraction,
  ClientEvents,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { UzCordClient } from './client';
import type { GuildSettings } from '../db/guilds';
import type { Translator } from '../i18n';

export type CommandCategory = 'moderation' | 'config' | 'utility';

export type AnySlashBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

/** Har bir komanda bajarilganda uzatiladigan yordamchi kontekst. */
export interface CommandContext {
  client: UzCordClient;
  /** Shu serverning bazadagi sozlamalari. */
  settings: GuildSettings;
  /** Serverning tiliga bog'langan tarjima funksiyasi. */
  t: Translator;
}

export interface Command {
  data: AnySlashBuilder;
  category: CommandCategory;
  /** Faqat serverda ishlaydimi (DM da emas). Standart: true */
  guildOnly?: boolean;
  /** Foydalanuvchi uchun kutish vaqti (soniya). Standart: 3 */
  cooldown?: number;
  /** Komanda ishlashi uchun botda bo'lishi shart bo'lgan ruxsatlar. */
  botPermissions?: bigint[];
  execute(interaction: ChatInputCommandInteraction, ctx: CommandContext): Promise<void>;
}

export function defineCommand(command: Command): Command {
  return command;
}

export interface BotEvent {
  name: keyof ClientEvents;
  once: boolean;
  execute: (client: UzCordClient, ...args: unknown[]) => unknown;
}

/** Event fayllarida tip xavfsizligini saqlagan holda handler yaratish. */
export function defineEvent<K extends keyof ClientEvents>(
  name: K,
  execute: (client: UzCordClient, ...args: ClientEvents[K]) => unknown,
  once = false
): BotEvent {
  return { name, once, execute: execute as BotEvent['execute'] };
}
