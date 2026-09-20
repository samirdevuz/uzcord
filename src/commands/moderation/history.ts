import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getUserCases } from '../../db/cases';
import { reply } from '../../modules/moderation/actions';
import { CASE_EMOJI, infoEmbed, truncate } from '../../utils/embeds';
import { shortDate } from '../../utils/time';

export default defineCommand({
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription("Foydalanuvchining barcha moderatsiya tarixini ko'rsatadi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("Foydalanuvchi").setRequired(true)
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const user = interaction.options.getUser('user', true);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const cases = await getUserCases(interaction.guildId!, user.id, 20);

    const embed = infoEmbed(undefined, t('mod.historyTitle', { user: user.tag })).setThumbnail(
      user.displayAvatarURL()
    );

    if (cases.length === 0) {
      embed.setDescription(t('mod.historyEmpty'));
      await reply(interaction, embed, true);
      return;
    }

    const lines = cases.map((item) => {
      const emoji = CASE_EMOJI[item.type] ?? '📋';
      const state = item.active ? '' : ' *(bekor qilingan)*';
      return (
        `${emoji} **#${item.case_number}** \`${item.type}\` — ${shortDate(item.created_at)}${state}\n` +
        `↳ ${truncate(item.reason ?? t('common.noReason'), 120)}`
      );
    });

    embed.setDescription(truncate(lines.join('\n'), 4000));
    await reply(interaction, embed, true);
  },
});
