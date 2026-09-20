import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from 'discord.js';
import { defineCommand } from '../../core/types';
import { addButtonRole, getPanelRoles, removeButtonRole } from '../../db/roles';
import { reply } from '../../modules/moderation/actions';
import { buildComponents, MAX_BUTTONS, refreshPanel } from '../../modules/roles/panel';
import { brandEmbed, errorEmbed, successEmbed } from '../../utils/embeds';
import { canManageRole } from '../../utils/permissions';

export default defineCommand({
  category: 'config',
  botPermissions: [PermissionFlagsBits.ManageRoles],
  data: new SlashCommandBuilder()
    .setName('buttonrole')
    .setDescription("Tugma orqali rol olish panelini boshqaradi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('panel')
        .setDescription("Yangi bo'sh panel yaratadi")
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('Panel joylashadigan kanal')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) =>
          option.setName('title').setDescription('Panel sarlavhasi').setMaxLength(200)
        )
        .addStringOption((option) =>
          option.setName('description').setDescription('Panel matni').setMaxLength(2000)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription("Panelga rol tugmasini qo'shadi")
        .addStringOption((option) =>
          option.setName('message_id').setDescription('Panel xabarining IDsi').setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName('role').setDescription('Beriladigan rol').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('label').setDescription('Tugma yozuvi').setMaxLength(80)
        )
        .addStringOption((option) =>
          option.setName('emoji').setDescription('Tugma emojisi')
        )
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription("Panel turgan kanal (bo'sh = joriy kanal)")
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Paneldan rol tugmasini olib tashlaydi')
        .addStringOption((option) =>
          option.setName('message_id').setDescription('Panel xabarining IDsi').setRequired(true)
        )
        .addRoleOption((option) =>
          option.setName('role').setDescription('Rol').setRequired(true)
        )
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const sub = interaction.options.getSubcommand();
    const me = guild.members.me!;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (sub === 'panel') {
      const channel = interaction.options.getChannel('channel', true) as TextChannel;
      const title = interaction.options.getString('title') ?? 'Rol tanlang';
      const description =
        interaction.options.getString('description') ??
        "Quyidagi tugmalardan birini bosing. Qayta bossangiz rol olib tashlanadi.";

      const message = await channel.send({ embeds: [brandEmbed(title, description)] });
      await reply(
        interaction,
        successEmbed(
          t('roles.panelCreated', { channel: `<#${channel.id}>`, id: message.id })
        ),
        true
      );
      return;
    }

    const messageId = interaction.options.getString('message_id', true).trim();
    const role = interaction.options.getRole('role', true);

    if (sub === 'add') {
      if (!canManageRole(me, role.id)) {
        await reply(interaction, errorEmbed(t('roles.roleTooHigh')), true);
        return;
      }

      const existing = await getPanelRoles(messageId);
      if (existing.length >= MAX_BUTTONS) {
        await reply(interaction, errorEmbed(t('roles.panelFull')), true);
        return;
      }

      // Panel xabarini topamiz: avval bazadagi yozuvdan, keyin ko'rsatilgan
      // kanaldan, oxirida joriy kanaldan.
      const channelId =
        existing[0]?.channel_id ??
        interaction.options.getChannel('channel')?.id ??
        interaction.channelId;
      const channel = (await guild.channels.fetch(channelId).catch(() => null)) as TextChannel | null;
      const message = channel ? await channel.messages.fetch(messageId).catch(() => null) : null;

      if (!message) {
        await reply(interaction, errorEmbed(t('roles.panelNotFound')), true);
        return;
      }

      const label = interaction.options.getString('label') ?? role.name;
      const emoji = interaction.options.getString('emoji');

      await addButtonRole({
        guild_id: guild.id,
        channel_id: message.channelId,
        message_id: messageId,
        role_id: role.id,
        label,
        emoji: emoji ?? null,
      });

      await refreshPanel(message, await getPanelRoles(messageId));
      await reply(interaction, successEmbed(t('roles.buttonAdded', { role: role.name })), true);
      return;
    }

    // remove
    const existing = await getPanelRoles(messageId);
    if (existing.length === 0) {
      await reply(interaction, errorEmbed(t('roles.panelNotFound')), true);
      return;
    }

    await removeButtonRole(messageId, role.id);
    const remaining = await getPanelRoles(messageId);

    const channel = (await guild.channels
      .fetch(existing[0].channel_id)
      .catch(() => null)) as TextChannel | null;
    const message = channel ? await channel.messages.fetch(messageId).catch(() => null) : null;
    if (message) {
      await message.edit({ components: buildComponents(remaining) });
    }

    await reply(interaction, successEmbed(t('roles.buttonRemoved', { role: role.name })), true);
  },
});
