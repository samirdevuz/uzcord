import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getMemberLevel, getMemberRank } from '../../db/leveling';
import { isLevelingActive, progressBar } from '../../modules/leveling';
import { reply } from '../../modules/moderation/actions';
import { COLORS, errorEmbed } from '../../utils/embeds';
import { xpProgress } from '../../utils/xp';

export default defineCommand({
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("Daraja, XP va reytingdagi o'rinni ko'rsatadi")
    .setDMPermission(false)
    .addUserOption((opt) => opt.setName('user').setDescription('Foydalanuvchi')),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;

    if (!(await isLevelingActive(guild.id))) {
      await reply(interaction, errorEmbed(t('level.disabled')), true);
      return;
    }

    const user = interaction.options.getUser('user') ?? interaction.user;
    if (user.bot) {
      await reply(interaction, errorEmbed(t('level.noXp', { user: user.username })), true);
      return;
    }

    const data = await getMemberLevel(guild.id, user.id);
    if (!data || Number(data.xp) <= 0) {
      await reply(interaction, errorEmbed(t('level.noXp', { user: user.username })), true);
      return;
    }

    const xp = Number(data.xp);
    const rank = await getMemberRank(guild.id, user.id);
    const progress = xpProgress(xp);
    const member = await guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(member?.displayColor || COLORS.brand)
      .setAuthor({ name: t('level.rankTitle', { user: member?.displayName ?? user.username }), iconURL: user.displayAvatarURL() })
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: t('level.rank'), value: rank ? `#${rank}` : '—', inline: true },
        { name: t('level.level'), value: String(progress.level), inline: true },
        { name: t('level.totalXp'), value: xp.toLocaleString('uz-UZ'), inline: true },
        {
          name: t('level.progress', { level: progress.level + 1 }),
          value:
            `\`${progressBar(progress.progressPercent, 16)}\` **${progress.progressPercent}%**\n` +
            `${progress.currentXpInLevel.toLocaleString('uz-UZ')} / ${progress.neededXpForLevel.toLocaleString('uz-UZ')} XP`,
        },
        { name: t('level.messages'), value: Number(data.messages).toLocaleString('uz-UZ'), inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
});
