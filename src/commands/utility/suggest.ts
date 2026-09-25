import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getSettings } from '../../db/guilds';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Server uchun taklif yuborish')
    .addStringOption((opt) => opt.setName('text').setDescription('Taklif matni').setRequired(true)),
  category: 'utility',

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;

    const text = interaction.options.getString('text', true);
    const settings = getSettings(interaction.guild.id);

    // If server_log_channel_id or message_log_channel_id is set or channel named 'suggestions'
    const channel = interaction.guild.channels.cache.find(
      (c) => c.name === 'takliflar' || c.name === 'suggestions'
    );

    const embed = new EmbedBuilder()
      .setTitle('💡 Yangi taklif')
      .setDescription(text)
      .setColor('#f59e0b')
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .addFields({ name: 'Holat', value: '⏳ Ko\'rib chiqilmoqda' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('suggest_upvote').setLabel('0').setEmoji('👍').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('suggest_downvote').setLabel('0').setEmoji('👎').setStyle(ButtonStyle.Secondary)
    );

    if (channel && 'send' in channel) {
      await (channel as any).send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Taklifingiz ${channel} kanaliga yuborildi!`, ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], components: [row] });
    }
  },
});
