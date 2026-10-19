import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ChannelType,
} from 'discord.js';
import { defineCommand } from '../../core/types';
import { getTicketSettings, updateTicketSettings } from '../../db/tickets';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket (murojaat) tizimini sozlash va panel joylash')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('panel')
        .setDescription('Murojaat panelini belgilangan kanalga joylaydi')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('Panel joylanadigan kanal')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Ticket sozlamalarini yangilaydi')
        .addBooleanOption((opt) => opt.setName('enabled').setDescription('Tizimni yoqish/o\'chirish'))
        .addChannelOption((opt) =>
          opt.setName('category').setDescription('Yangi ticket kanallari ochiladigan kategoriya').addChannelTypes(ChannelType.GuildCategory)
        )
        .addRoleOption((opt) => opt.setName('support_role').setDescription('Murojaatni ko\'ra oladigan support rol'))
        .addChannelOption((opt) =>
          opt.setName('transcript_channel').setDescription('Log va transcriptlar saqlanadigan kanal').addChannelTypes(ChannelType.GuildText)
        )
    ),
  category: 'config',

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'setup') {
      const enabled = interaction.options.getBoolean('enabled');
      const category = interaction.options.getChannel('category');
      const role = interaction.options.getRole('support_role');
      const transcript = interaction.options.getChannel('transcript_channel');

      const settings = await getTicketSettings(interaction.guild.id);
      const patch: Record<string, unknown> = {};

      if (enabled !== null) patch.enabled = enabled;
      if (category) patch.category_id = category.id;
      if (role) {
        const roles = new Set(settings.support_role_ids);
        roles.add(role.id);
        patch.support_role_ids = Array.from(roles);
      }
      if (transcript) patch.transcript_channel_id = transcript.id;

      await updateTicketSettings(interaction.guild.id, patch);

      await interaction.reply({
        content: '✅ Ticket sozlamalari yangilandi.',
        ephemeral: true,
      });
      return;
    }

    if (subcommand === 'panel') {
      const channel = interaction.options.getChannel('channel', true);
      if (channel.type !== ChannelType.GuildText || !('send' in channel)) {
        await interaction.reply({ content: "Noto'g'ri kanal tanlandi.", ephemeral: true });
        return;
      }

      const settings = await getTicketSettings(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setTitle(`📩 ${settings.panel_title}`)
        .setDescription(settings.panel_description)
        .setColor('#3b82f6')
        .setFooter({ text: 'UzCord Ticket System' });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('Murojaat yaratish')
          .setEmoji('📩')
          .setStyle(ButtonStyle.Primary)
      );

      const msg = await channel.send({ embeds: [embed], components: [row] });
      await updateTicketSettings(interaction.guild.id, {
        enabled: true,
        panel_channel_id: channel.id,
        panel_message_id: msg.id,
      });

      await interaction.reply({
        content: `✅ Murojaat paneli ${channel} kanalida yaratildi.`,
        ephemeral: true,
      });
    }
  },
});
