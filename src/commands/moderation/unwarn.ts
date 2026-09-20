import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { clearWarnings, deactivateCase, getCase } from '../../db/cases';
import { recordCase, reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription("Ogohlantirishni bekor qiladi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('case')
        .setDescription("Bitta ogohlantirishni case raqami bo'yicha bekor qiladi")
        .addIntegerOption((option) =>
          option.setName('number').setDescription("Case raqami").setRequired(true).setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('all')
        .setDescription("Foydalanuvchining barcha ogohlantirishlarini tozalaydi")
        .addUserOption((option) =>
          option.setName('user').setDescription("Foydalanuvchi").setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription("Sabab").setMaxLength(400)
        )
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;

    if (interaction.options.getSubcommand() === 'case') {
      const number = interaction.options.getInteger('number', true);
      const modCase = await getCase(guild.id, number);

      if (!modCase || modCase.type !== 'warn') {
        await reply(interaction, errorEmbed(t('error.caseNotFound', { case: number })), true);
        return;
      }

      if (!(await deactivateCase(guild.id, number))) {
        await reply(interaction, errorEmbed(t('error.caseNotFound', { case: number })), true);
        return;
      }

      await interaction.deferReply();
      await recordCase(
        guild,
        {
          guildId: guild.id,
          type: 'unwarn',
          userId: modCase.user_id,
          userTag: modCase.user_tag,
          moderatorId: interaction.user.id,
          moderatorTag: interaction.user.tag,
          reason: `Case #${number} bekor qilindi`,
        },
        t
      );
      await reply(interaction, successEmbed(t('mod.warnRemoved', { case: number })));
      return;
    }

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason');
    const count = await clearWarnings(guild.id, user.id);

    if (count === 0) {
      await reply(interaction, errorEmbed(t('error.noWarnings', { user: user.tag })), true);
      return;
    }

    await interaction.deferReply();
    await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'unwarn',
        userId: user.id,
        userTag: user.tag,
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
        reason: reason ?? `${count} ta ogohlantirish tozalandi`,
      },
      t
    );

    await reply(interaction, successEmbed(t('mod.warnsCleared', { user: user.tag, count })));
  },
});
