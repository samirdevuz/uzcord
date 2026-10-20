import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getLeaderboard, getMemberLevel, getMemberRank } from '../../db/leveling';
import { isLevelingActive } from '../../modules/leveling';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed } from '../../utils/embeds';

const MEDALS = ['🥇', '🥈', '🥉'];

export default defineCommand({
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription("Eng faol a'zolar reytingi")
    .setDMPermission(false)
    .addIntegerOption((opt) => opt.setName('page').setDescription('Sahifa').setMinValue(1).setMaxValue(50)),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;

    if (!(await isLevelingActive(guild.id))) {
      await reply(interaction, errorEmbed(t('level.disabled')), true);
      return;
    }

    const page = interaction.options.getInteger('page') ?? 1;
    const perPage = 10;
    const rows = await getLeaderboard(guild.id, page * perPage);
    const slice = rows.slice((page - 1) * perPage);
    if (slice.length === 0) {
      await reply(interaction, errorEmbed(t('level.leaderboardEmpty')), true);
      return;
    }

    const lines = slice.map((row, index) => {
      const position = (page - 1) * perPage + index + 1;
      const badge = MEDALS[position - 1] ?? `\`#${position}\``;
      return `${badge} <@${row.user_id}> — **${row.level}**-daraja · ${Number(row.xp).toLocaleString('uz-UZ')} XP`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle(`🏆 ${t('level.leaderboardTitle', { guild: guild.name })}`)
      .setThumbnail(guild.iconURL({ size: 128 }))
      .setDescription(lines.join('\n'))
      .setTimestamp();

    const own = await getMemberLevel(guild.id, interaction.user.id);
    if (own && Number(own.xp) > 0) {
      const rank = await getMemberRank(guild.id, interaction.user.id);
      embed.setFooter({ text: t('level.leaderboardYou', { rank, level: own.level }) });
    }

    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  },
});
