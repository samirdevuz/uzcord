import { EmbedBuilder, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { sendLog } from '../modules/logging';
import { getSettings } from '../db/guilds';
import { inspectMessage } from '../modules/automod/engine';
import { createTranslator } from '../i18n';
import { COLORS, truncate } from '../utils/embeds';

export default defineEvent(Events.MessageUpdate, async (_client, oldMessage, newMessage) => {
  if (!newMessage.guild) return;
  if (newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  // Tahrirlangan xabar ham AutoMod tekshiruvidan o'tadi.
  const full = newMessage.partial ? await newMessage.fetch().catch(() => null) : newMessage;
  if (full) await inspectMessage(full);

  const settings = getSettings(newMessage.guild.id);
  const t = createTranslator(settings.locale);

  const embed = new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle(`✏️ ${t('log.messageEdited')}`)
    .addFields(
      {
        name: t('log.author'),
        value: newMessage.author
          ? `<@${newMessage.author.id}>\n\`${newMessage.author.id}\``
          : t('common.none'),
        inline: true,
      },
      { name: t('common.channel'), value: `<#${newMessage.channelId}>`, inline: true },
      { name: t('log.before'), value: truncate(oldMessage.content || t('log.empty')) },
      { name: t('log.after'), value: truncate(newMessage.content || t('log.empty')) }
    )
    .setTimestamp();

  if (newMessage.url) {
    embed.setDescription(`[${t('log.jumpToMessage')}](${newMessage.url})`);
  }

  await sendLog(newMessage.guild, 'message', embed);
});
