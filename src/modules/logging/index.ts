import {
  ChannelType,
  PermissionFlagsBits,
  type EmbedBuilder,
  type Guild,
  type TextChannel,
} from 'discord.js';
import { createLogger } from '../../core/logger';
import { getSettings, isModuleEnabled, LOG_COLUMNS, type LogKind } from '../../db/guilds';

const log = createLogger('logging');

/**
 * Log embedini serverning tegishli log kanaliga yuboradi.
 * Kanal sozlanmagan, topilmagan yoki ruxsat yetmasa — jimgina to'xtaydi.
 */
export async function sendLog(
  guild: Guild,
  kind: LogKind,
  embed: EmbedBuilder
): Promise<void> {
  try {
    const settings = getSettings(guild.id);
    if (!isModuleEnabled(settings, 'logging')) return;

    const channelId = settings[LOG_COLUMNS[kind]] as string | null;
    if (!channelId) return;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    const me = guild.members.me;
    if (!me) return;

    const permissions = (channel as TextChannel).permissionsFor(me);
    if (
      !permissions?.has(PermissionFlagsBits.ViewChannel) ||
      !permissions.has(PermissionFlagsBits.SendMessages) ||
      !permissions.has(PermissionFlagsBits.EmbedLinks)
    ) {
      return;
    }

    await (channel as TextChannel).send({ embeds: [embed] });
  } catch (error) {
    log.warn(`Log yuborilmadi (${guild.id}/${kind}):`, error);
  }
}
