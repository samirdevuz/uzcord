import { EmbedBuilder, Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { sendLog } from '../modules/logging';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import { COLORS, truncate } from '../utils/embeds';

export default defineEvent(Events.MessageDelete, async (_client, message) => {
  if (!message.guild) return;
  if (message.partial && !message.author) return;
  if (message.author?.bot) return;

  const settings = getSettings(message.guild.id);
  const t = createTranslator(settings.locale);

  const embed = new EmbedBuilder()
    .setColor(COLORS.danger)
    .setTitle(`🗑️ ${t('log.messageDeleted')}`)
    .addFields(
      {
        name: t('log.author'),
        value: message.author ? `<@${message.author.id}>\n\`${message.author.id}\`` : t('common.none'),
        inline: true,
      },
      { name: t('common.channel'), value: `<#${message.channelId}>`, inline: true },
      { name: t('log.content'), value: truncate(message.content || t('log.empty')) }
    )
    .setTimestamp();

  if (message.attachments?.size) {
    embed.addFields({
      name: t('log.attachments'),
      value: truncate(message.attachments.map((file) => file.name).join('\n'), 500),
    });
  }

  await sendLog(message.guild, 'message', embed);
});
