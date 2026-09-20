import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { countActiveWarnings } from '../../db/cases';
import { dmPunishment, ensureTargetAllowed, recordCase, reply } from '../../modules/moderation/actions';
import { applyEscalation } from '../../modules/moderation/escalation';
import { errorEmbed, successEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription("A'zoni ogohlantiradi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("Ogohlantiriladigan a'zo").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription("Sabab").setRequired(true).setMaxLength(400)
    ),

  async execute(interaction, ctx) {
    const { t, settings } = ctx;
    const guild = interaction.guild!;
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await reply(interaction, errorEmbed(t('error.memberNotFound')), true);
      return;
    }
    if (!(await ensureTargetAllowed(interaction, member, t))) return;

    await interaction.deferReply();

    const modCase = await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'warn',
        userId: user.id,
        userTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason,
      },
      t
    );

    await dmPunishment(user, guild, 'warn', reason, null, t, settings);

    const count = await countActiveWarnings(guild.id, user.id);
    const embed = successEmbed(
      t('mod.warned', { user: user.tag, count, case: modCase.case_number })
    );

    const escalated = await applyEscalation(guild, member, count, t, settings);
    if (escalated) {
      embed.setFooter({ text: t('mod.escalation', { count, action: escalated }) });
    }

    await reply(interaction, embed);
  },
});
