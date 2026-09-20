import { EmbedBuilder, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { sendLog } from '../modules/logging';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import { COLORS } from '../utils/embeds';

export default defineEvent(Events.VoiceStateUpdate, async (_client, oldState, newState) => {
  const guild = newState.guild ?? oldState.guild;
  if (!guild) return;

  const member = newState.member ?? oldState.member;
  if (!member || member.user.bot) return;

  const settings = getSettings(guild.id);
  const t = createTranslator(settings.locale);

  const embed = new EmbedBuilder().setTimestamp().addFields({
    name: t('common.user'),
    value: `<@${member.id}>`,
    inline: true,
  });

  if (!oldState.channelId && newState.channelId) {
    embed
      .setColor(COLORS.success)
      .setTitle(`🔊 ${t('log.voiceJoin')}`)
      .addFields({ name: t('common.channel'), value: `<#${newState.channelId}>`, inline: true });
  } else if (oldState.channelId && !newState.channelId) {
    embed
      .setColor(COLORS.danger)
      .setTitle(`🔇 ${t('log.voiceLeave')}`)
      .addFields({ name: t('common.channel'), value: `<#${oldState.channelId}>`, inline: true });
  } else if (oldState.channelId !== newState.channelId) {
    embed
      .setColor(COLORS.info)
      .setTitle(`🔁 ${t('log.voiceMove')}`)
      .addFields(
        { name: t('log.before'), value: `<#${oldState.channelId}>`, inline: true },
        { name: t('log.after'), value: `<#${newState.channelId}>`, inline: true }
      );
  } else {
    // Mute/deafen kabi o'zgarishlar loglanmaydi — shovqin bo'lmasligi uchun.
    return;
  }

  await sendLog(guild, 'voice', embed);
});
