import { ChannelType, Events, PermissionFlagsBits, type VoiceBasedChannel } from 'discord.js';
import { defineEvent } from '../core/types';
import { createLogger } from '../core/logger';

const log = createLogger('tempvoice');

/** Shu nomli ovozli kanalga kirgan a'zoga shaxsiy kanal ochiladi. */
const TRIGGER_NAMES = ['join-to-create', 'voice-yaratish', '+ create voice', '➕ kanal yaratish'];
const TEMP_PREFIX = '🔊 ';
const TEMP_SUFFIX = ' kanali';

/** Bot yaratgan kanallar. Qayta ishga tushganda nom bo'yicha ham taniladi. */
const tempChannels = new Set<string>();

function isTrigger(channel: VoiceBasedChannel): boolean {
  const name = channel.name.toLowerCase();
  return TRIGGER_NAMES.some((trigger) => name.includes(trigger));
}

function isTemp(channel: VoiceBasedChannel): boolean {
  return tempChannels.has(channel.id) || (channel.name.startsWith(TEMP_PREFIX) && channel.name.endsWith(TEMP_SUFFIX));
}

export default defineEvent(Events.VoiceStateUpdate, async (_client, oldState, newState) => {
  const guild = newState.guild ?? oldState.guild;
  const me = guild.members.me;
  if (!me?.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers])) return;

  // Trigger kanalga kirdi — shaxsiy kanal ochamiz.
  const joined = newState.channel;
  if (joined && newState.member && !newState.member.user.bot && isTrigger(joined) && joined.id !== oldState.channelId) {
    const member = newState.member;
    const created = await guild.channels
      .create({
        name: `${TEMP_PREFIX}${member.displayName}${TEMP_SUFFIX}`.slice(0, 100),
        type: ChannelType.GuildVoice,
        parent: joined.parentId ?? undefined,
        bitrate: joined.bitrate,
        userLimit: joined.userLimit,
        permissionOverwrites: [
          ...joined.permissionOverwrites.cache.values(),
          {
            id: member.id,
            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers],
          },
        ],
        reason: `Vaqtinchalik kanal: ${member.user.tag}`,
      })
      .catch((error: unknown) => {
        log.warn(`Vaqtinchalik kanal yaratilmadi (${guild.id}):`, error);
        return null;
      });

    if (created) {
      tempChannels.add(created.id);
      await member.voice.setChannel(created).catch(() => created.delete().catch(() => null));
    }
  }

  // Vaqtinchalik kanal bo'shab qoldi — o'chiramiz.
  const left = oldState.channel;
  if (left && left.id !== newState.channelId && isTemp(left) && left.members.size === 0) {
    tempChannels.delete(left.id);
    await left.delete("Vaqtinchalik kanal bo'sh qoldi").catch(() => null);
  }
});
