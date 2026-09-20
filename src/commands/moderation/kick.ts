import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { dmPunishment, ensureTargetAllowed, recordCase, reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.KickMembers],
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription("A'zoni serverdan chiqaradi")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("Chiqariladigan a'zo").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription("Sabab").setMaxLength(400)
    ),

  async execute(interaction, ctx) {
    const { t, settings } = ctx;
    const guild = interaction.guild!;
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await reply(interaction, errorEmbed(t('error.memberNotFound')), true);
      return;
    }
    if (!(await ensureTargetAllowed(interaction, member, t))) return;

    await interaction.deferReply();
    await dmPunishment(user, guild, 'kick', reason, null, t, settings);

    try {
      await member.kick(`${interaction.user.tag}: ${reason ?? t('common.noReason')}`);
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })));
      return;
    }

    const modCase = await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'kick',
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
      successEmbed(t('mod.kicked', { user: user.tag, case: modCase.case_number }))
    );
  },
});
