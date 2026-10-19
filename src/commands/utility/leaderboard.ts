import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getLeaderboard, getLevelSettings } from '../../db/leveling';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription("Serverning eng faol a'zolari peshqadambol jadvali"),
  category: 'utility',

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;

    const levelSettings = await getLevelSettings(interaction.guild.id);
    if (!levelSettings.enabled) {
      await interaction.reply({
        content: "Ushbu serverda leveling / XP tizimi o'chirilgan.",
        ephemeral: true,
      });
      return;
    }

    const leaderboard = await getLeaderboard(interaction.guild.id, 10);
    if (leaderboard.length === 0) {
      await interaction.reply({
        content: "Peshqadambol jadvali hali bo'sh.",
        ephemeral: true,
      });
      return;
    }

    const lines = leaderboard.map((item, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `\`#${index + 1}\``;
      const tag = item.user_tag ?? `<@${item.user_id}>`;
      return `${medal} **${tag}** — Level **${item.level}** (${item.xp.toLocaleString()} XP)`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${interaction.guild.name} — Leaderboard`)
      .setDescription(lines.join('\n'))
      .setColor('#f59e0b')
      .setFooter({ text: 'UzCord Leveling System' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
});
