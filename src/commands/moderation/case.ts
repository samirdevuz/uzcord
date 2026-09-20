import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getCase, updateCaseReason } from '../../db/cases';
import { buildCaseEmbed, reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription("Moderatsiya case ini ko'rish yoki tahrirlash")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription("Case ma'lumotlarini ko'rsatadi")
        .addIntegerOption((option) =>
          option.setName('number').setDescription("Case raqami").setRequired(true).setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('reason')
        .setDescription("Case sababini o'zgartiradi")
        .addIntegerOption((option) =>
          option.setName('number').setDescription("Case raqami").setRequired(true).setMinValue(1)
        )
        .addStringOption((option) =>
          option.setName('text').setDescription("Yangi sabab").setRequired(true).setMaxLength(400)
        )
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guildId = interaction.guildId!;
    const number = interaction.options.getInteger('number', true);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const modCase = await getCase(guildId, number);

    if (!modCase) {
      await reply(interaction, errorEmbed(t('error.caseNotFound', { case: number })), true);
      return;
    }

    if (interaction.options.getSubcommand() === 'view') {
      await reply(interaction, buildCaseEmbed(modCase, t), true);
      return;
    }

    const text = interaction.options.getString('text', true);
    await updateCaseReason(guildId, number, text);
    await reply(interaction, successEmbed(`\`Case #${number}\` sababi yangilandi.`), true);
  },
});
