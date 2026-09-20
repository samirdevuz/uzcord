import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { dmPunishment, ensureTargetAllowed, recordCase, reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';
import { formatDuration, MAX_TIMEOUT, parseDuration } from '../../utils/time';

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription("A'zoga vaqtinchalik jimlik (timeout) beradi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("Timeout beriladigan a'zo").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription("Muddat: 10m, 2h, 7d (eng ko'pi 28 kun)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription("Sabab").setMaxLength(400)
    ),

  async execute(interaction, ctx) {
    const { t, settings } = ctx;
    const guild = interaction.guild!;
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');

    const durationMs = parseDuration(interaction.options.getString('duration', true));
    if (durationMs === null) {
      await reply(interaction, errorEmbed(t('error.invalidDuration')), true);
      return;
    }
    if (durationMs > MAX_TIMEOUT) {
      await reply(
        interaction,
        errorEmbed(t('error.durationTooLong', { max: formatDuration(MAX_TIMEOUT) })),
        true
      );
      return;
    }

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await reply(interaction, errorEmbed(t('error.memberNotFound')), true);
      return;
    }
    if (!(await ensureTargetAllowed(interaction, member, t))) return;

    await interaction.deferReply();

    try {
      await member.timeout(durationMs, `${interaction.user.tag}: ${reason ?? t('common.noReason')}`);
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })));
      return;
    }

    await dmPunishment(user, guild, 'timeout', reason, durationMs, t, settings);

    const modCase = await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'timeout',
        userId: user.id,
        userTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason,
        durationMs,
      },
      t
    );

    await reply(
      interaction,
      successEmbed(
        t('mod.timedOut', {
          user: user.tag,
          duration: formatDuration(durationMs),
          case: modCase.case_number,
        })
      )
    );
  },
});
