import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { removeTempActionFor } from '../../db/cases';
import { recordCase, reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription("Foydalanuvchining banini olib tashlaydi")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('user_id')
        .setDescription("Ban olib tashlanadigan foydalanuvchining ID si")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription("Sabab").setMaxLength(400)
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const userId = interaction.options.getString('user_id', true).replace(/\D/g, '');
    const reason = interaction.options.getString('reason');

    if (!userId) {
      await reply(interaction, errorEmbed(t('error.userNotFound')), true);
      return;
    }

    await interaction.deferReply();

    const ban = await guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      await reply(interaction, errorEmbed(t('error.notBanned')));
      return;
    }

    try {
      await guild.bans.remove(userId, `${interaction.user.tag}: ${reason ?? t('common.noReason')}`);
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })));
      return;
    }

    await removeTempActionFor(guild.id, userId, 'ban');

    const modCase = await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'unban',
        userId,
        userTag: ban.user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason,
      },
      t
    );

    await reply(
      interaction,
      successEmbed(t('mod.unbanned', { user: ban.user.tag, case: modCase.case_number }))
    );
  },
});
