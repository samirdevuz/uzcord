import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getLevelSettings, getMemberLevel, getMemberRank } from '../../db/leveling';
import { xpProgress } from '../../utils/xp';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("Foydalanuvchining XP va darajasini ko'rsatadi")
    .addUserOption((opt) =>
      opt.setName('user').setDescription('Foydalanuvchi').setRequired(false)
    ),
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

    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const memberData = await getMemberLevel(interaction.guild.id, targetUser.id);

    if (!memberData) {
      await interaction.reply({
        content: `${targetUser.tag} hali XP ga ega emas.`,
        ephemeral: true,
      });
      return;
    }

    const rank = await getMemberRank(interaction.guild.id, targetUser.id);
    const progress = xpProgress(memberData.xp);

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${targetUser.username} — Rank Card`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setColor('#3b82f6')
      .addFields(
        { name: "O'rni (Rank)", value: `#${rank || '-'}`, inline: true },
        { name: 'Daraja (Level)', value: `${progress.level}`, inline: true },
        { name: 'Jami XP', value: `${memberData.xp.toLocaleString()}`, inline: true },
        {
          name: 'Progress',
          value: `${progress.currentXpInLevel} / ${progress.neededXpForLevel} XP (${progress.progressPercent}%)`,
        },
        { name: 'Xabarlar soni', value: `${memberData.messages.toLocaleString()}`, inline: true }
      )
      .setFooter({ text: 'UzCord Leveling System' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
});
