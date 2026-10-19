import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { defineCommand } from '../../core/types';

// Global AFK state in memory: guildId:userId -> reason
export const afkUsers = new Map<string, { reason: string; timestamp: number }>();

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('AFK (Klaviaturadan uzoqda) holatini o\'rnatadi')
    .addStringOption((opt) => opt.setName('reason').setDescription('Sabab')),
  category: 'utility',

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;

    const reason = interaction.options.getString('reason') ?? 'Sabab ko\'rsatilmadi';
    const key = `${interaction.guild.id}:${interaction.user.id}`;

    afkUsers.set(key, { reason, timestamp: Date.now() });

    await interaction.reply({
      content: `💤 **${interaction.user.username}** endi AFK: *${reason}*`,
    });
  },
});
