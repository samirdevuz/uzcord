import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { countActiveWarnings } from '../../db/cases';
import { reply } from '../../modules/moderation/actions';
import { brandEmbed, truncate } from '../../utils/embeds';
import { fullDate, relative } from '../../utils/time';

export default defineCommand({
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription("Foydalanuvchi haqida ma'lumot beradi")
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("Foydalanuvchi (bo'sh = o'zingiz)")
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const user = interaction.options.getUser('user') ?? interaction.user;
    const member = await interaction.guild!.members.fetch(user.id).catch(() => null);

    const embed = brandEmbed(t('util.userInfoTitle', { user: user.tag }))
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: `\`${user.id}\``, inline: true },
        { name: t('util.bot'), value: user.bot ? '✅' : '❌', inline: true },
        { name: t('util.createdAt'), value: fullDate(user.createdTimestamp), inline: true }
      );

    if (member) {
      const roles = member.roles.cache
        .filter((role) => role.id !== interaction.guildId)
        .sort((a, b) => b.position - a.position)
        .map((role) => `<@&${role.id}>`);

      embed.addFields(
        {
          name: t('util.nickname'),
          value: member.nickname ?? t('common.none'),
          inline: true,
        },
        {
          name: t('log.joinedAt'),
          value: member.joinedTimestamp ? fullDate(member.joinedTimestamp) : t('common.none'),
          inline: true,
        },
        {
          name: t('util.highestRole'),
          value: `<@&${member.roles.highest.id}>`,
          inline: true,
        },
        {
          name: `${t('util.roles')} (${roles.length})`,
          value: roles.length > 0 ? truncate(roles.join(' '), 1000) : t('common.none'),
        }
      );

      if (member.communicationDisabledUntilTimestamp) {
        embed.addFields({
          name: t('util.timedOutUntil'),
          value: relative(member.communicationDisabledUntilTimestamp),
          inline: true,
        });
      }

      const warnings = await countActiveWarnings(interaction.guildId!, user.id);
      if (warnings > 0) {
        embed.addFields({ name: '⚠️ Ogohlantirishlar', value: String(warnings), inline: true });
      }
    }

    await reply(interaction, embed);
  },
});
