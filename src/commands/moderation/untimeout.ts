import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { ensureTargetAllowed, recordCase, reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription("A'zoning timeoutini olib tashlaydi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("A'zo").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription("Sabab").setMaxLength(400)
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await reply(interaction, errorEmbed(t('error.memberNotFound')), true);
      return;
    }
    if (!member.isCommunicationDisabled()) {
      await reply(interaction, errorEmbed(t('error.notTimedOut')), true);
      return;
    }
    if (!(await ensureTargetAllowed(interaction, member, t))) return;

    await interaction.deferReply();

    try {
      await member.timeout(null, `${interaction.user.tag}: ${reason ?? t('common.noReason')}`);
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })));
      return;
    }

    const modCase = await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'untimeout',
        userId: user.id,
        userTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason,
      },
      t
    );

    await reply(
      interaction,
      successEmbed(t('mod.timeoutRemoved', { user: user.tag, case: modCase.case_number }))
    );
  },
});
