import { SlashCommandBuilder, type GuildMember } from 'discord.js';
import { defineCommand } from '../../core/types';
import { setAfk } from '../../modules/afk';

export default defineCommand({
  category: 'community',
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('AFK holatini yoqadi — sizni eslatganlarga sabab ko\'rsatiladi')
    .setDMPermission(false)
    .addStringOption((opt) => opt.setName('reason').setDescription('Sabab').setMaxLength(200)),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const member = interaction.member as GuildMember;
    const reason = interaction.options.getString('reason') ?? t('afk.noReason');
    await setAfk(member, reason);
    await interaction.reply({ content: t('afk.set', { user: member.displayName, reason }), allowedMentions: { parse: [] } });
  },
});
