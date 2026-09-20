import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { addTempAction } from '../../db/cases';
import { dmPunishment, ensureTargetAllowed, recordCase, reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';
import { formatDuration, parseDuration } from '../../utils/time';

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription("Foydalanuvchini serverdan ban qiladi")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription("Ban qilinadigan foydalanuvchi").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription("Ban sababi").setMaxLength(400)
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription("Vaqtinchalik ban muddati, masalan 7d yoki 12h (bo'sh = doimiy)")
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_messages')
        .setDescription("Oxirgi qancha vaqtdagi xabarlari o'chirilsin")
        .addChoices(
          { name: "O'chirilmasin", value: 0 },
          { name: '1 soat', value: 3600 },
          { name: '6 soat', value: 21600 },
          { name: '1 kun', value: 86400 },
          { name: '7 kun', value: 604800 }
        )
    ),

  async execute(interaction, ctx) {
    const { t, settings } = ctx;
    const guild = interaction.guild!;
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');
    const durationInput = interaction.options.getString('duration');
    const deleteSeconds = interaction.options.getInteger('delete_messages') ?? 0;

    let durationMs: number | null = null;
    if (durationInput) {
      durationMs = parseDuration(durationInput);
      if (durationMs === null) {
        await reply(interaction, errorEmbed(t('error.invalidDuration')), true);
        return;
      }
    }

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member && !(await ensureTargetAllowed(interaction, member, t))) return;

    const existingBan = await guild.bans.fetch(user.id).catch(() => null);
    if (existingBan) {
      await reply(interaction, errorEmbed(`**${user.tag}** allaqachon ban qilingan.`), true);
      return;
    }

    await interaction.deferReply();

    const type = durationMs ? 'tempban' : 'ban';
    await dmPunishment(user, guild, type, reason, durationMs, t, settings);

    try {
      await guild.bans.create(user.id, {
        reason: `${interaction.user.tag}: ${reason ?? t('common.noReason')}`,
        deleteMessageSeconds: deleteSeconds,
      });
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })));
      return;
    }

    const modCase = await recordCase(
      guild,
      {
        guildId: guild.id,
        type,
        userId: user.id,
        userTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason,
        durationMs,
      },
      t
    );

    if (durationMs) {
      await addTempAction(guild.id, user.id, 'ban', Date.now() + durationMs, modCase.case_number);
      await reply(
        interaction,
        successEmbed(
          t('mod.tempBanned', {
            user: user.tag,
            duration: formatDuration(durationMs),
            case: modCase.case_number,
          })
        )
      );
    } else {
      await reply(
        interaction,
        successEmbed(t('mod.banned', { user: user.tag, case: modCase.case_number }))
      );
    }
  },
});
