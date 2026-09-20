import {
  ChannelType,
  PermissionFlagsBits,
  type GuildMember,
  type PartialGuildMember,
  type TextChannel,
} from 'discord.js';
import { createLogger } from '../../core/logger';
import { getSettings, isModuleEnabled } from '../../db/guilds';
import { brandEmbed } from '../../utils/embeds';

const log = createLogger('welcome');

export const DEFAULT_WELCOME =
  "Xush kelibsiz, {user}! **{server}** serveriga qo'shildingiz. Endi bizda {memberCount} ta a'zo bor.";
export const DEFAULT_GOODBYE = "**{user.tag}** serverdan chiqdi. Endi {memberCount} ta a'zo qoldi.";

/** Shablondagi {user}, {server} kabi joylarni haqiqiy qiymatlar bilan almashtiradi. */
export function renderTemplate(
  template: string,
  member: GuildMember | PartialGuildMember
): string {
  return template
    .replace(/\{user\.tag\}/g, member.user.tag)
    .replace(/\{user\.name\}/g, member.user.username)
    .replace(/\{user\.id\}/g, member.id)
    .replace(/\{user\}/g, `<@${member.id}>`)
    .replace(/\{server\}/g, member.guild.name)
    .replace(/\{memberCount\}/g, String(member.guild.memberCount));
}

async function post(
  member: GuildMember | PartialGuildMember,
  channelId: string,
  text: string
): Promise<void> {
  const channel = await member.guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const me = member.guild.members.me;
  if (!me) return;

  const permissions = (channel as TextChannel).permissionsFor(me);
  if (!permissions?.has(PermissionFlagsBits.SendMessages)) return;

  if (permissions.has(PermissionFlagsBits.EmbedLinks)) {
    await (channel as TextChannel).send({
      embeds: [brandEmbed(undefined, text).setThumbnail(member.user.displayAvatarURL())],
    });
  } else {
    await (channel as TextChannel).send({ content: text });
  }
}

export async function handleJoin(member: GuildMember): Promise<void> {
  const settings = getSettings(member.guild.id);
  if (!isModuleEnabled(settings, 'welcome')) return;

  if (settings.welcome_channel_id) {
    try {
      await post(
        member,
        settings.welcome_channel_id,
        renderTemplate(settings.welcome_message ?? DEFAULT_WELCOME, member)
      );
    } catch (error) {
      log.warn('Xush kelibsiz xabari yuborilmadi:', error);
    }
  }

  if (settings.autorole_id) {
    try {
      const role = member.guild.roles.cache.get(settings.autorole_id);
      const me = member.guild.members.me;
      if (role && me && !role.managed && me.roles.highest.comparePositionTo(role) > 0) {
        await member.roles.add(role, 'Avtomatik rol (autorole)');
      }
    } catch (error) {
      log.warn('Avtomatik rol berilmadi:', error);
    }
  }
}

export async function handleLeave(member: GuildMember | PartialGuildMember): Promise<void> {
  const settings = getSettings(member.guild.id);
  if (!isModuleEnabled(settings, 'welcome')) return;
  if (!settings.goodbye_channel_id) return;

  try {
    await post(
      member,
      settings.goodbye_channel_id,
      renderTemplate(settings.goodbye_message ?? DEFAULT_GOODBYE, member)
    );
  } catch (error) {
    log.warn('Xayrlashuv xabari yuborilmadi:', error);
  }
}
