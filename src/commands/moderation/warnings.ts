import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getActiveWarnings } from '../../db/cases';
import { reply } from '../../modules/moderation/actions';
import { infoEmbed, truncate } from '../../utils/embeds';
import { shortDate } from '../../utils/time';

export default defineCommand({
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription("Foydalanuvchining faol ogohlantirishlarini ko'rsatadi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("Foydalanuvchi").setRequired(true)
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const user = interaction.options.getUser('user', true);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const warnings = await getActiveWarnings(interaction.guildId!, user.id);

    const embed = infoEmbed(undefined, t('mod.warningsTitle', { user: user.tag })).setThumbnail(
      user.displayAvatarURL()
    );

    if (warnings.length === 0) {
      embed.setDescription(t('error.noWarnings', { user: user.tag }));
      await reply(interaction, embed, true);
      return;
    }

    embed.setDescription(`${t('common.total')}: **${warnings.length}**`);
    for (const warning of warnings.slice(0, 15)) {
      embed.addFields({
        name: `#${warning.case_number} — ${shortDate(warning.created_at)}`,
        value: truncate(
          `${t('common.moderator')}: <@${warning.moderator_id}>\n` +
            `${t('common.reason')}: ${warning.reason ?? t('common.noReason')}`,
          300
        ),
      });
    }

    if (warnings.length > 15) {
      embed.setFooter({ text: `+${warnings.length - 15} ta yana` });
    }

    await reply(interaction, embed, true);
  },
});
