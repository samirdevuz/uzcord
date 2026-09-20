import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { brandEmbed } from '../../utils/embeds';
import { formatDuration } from '../../utils/time';

export default defineCommand({
  category: 'utility',
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Botning javob tezligini tekshiradi"),

  async execute(interaction, ctx) {
    const { t, client } = ctx;
    const sent = Date.now();
    await interaction.deferReply();

    const embed = brandEmbed(`🏓 ${t('util.pong')}`).addFields(
      { name: t('util.latencyApi'), value: `${Date.now() - sent} ms`, inline: true },
      {
        name: t('util.latencyWs'),
        value: `${Math.max(client.ws.ping, 0)} ms`,
        inline: true,
      },
      {
        name: t('util.uptime'),
        value: formatDuration(client.uptime ?? 0, 3),
        inline: true,
      }
    );

    await reply(interaction, embed);
  },
});
