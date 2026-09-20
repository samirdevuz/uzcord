import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type TextChannel } from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed, warningEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription("Kanalni yopadi (oddiy a'zolar yoza olmaydi)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription("Kanal (bo'sh = joriy kanal)")
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription("Sabab").setMaxLength(400)
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const channel = (interaction.options.getChannel('channel') ??
      interaction.channel) as TextChannel | null;
    const reason = interaction.options.getString('reason');

    if (!channel || channel.type !== ChannelType.GuildText) {
      await reply(interaction, errorEmbed(t('error.channelType')), true);
      return;
    }

    const everyone = guild.roles.everyone;
    const current = channel.permissionOverwrites.cache.get(everyone.id);
    if (current?.deny.has(PermissionFlagsBits.SendMessages)) {
      await reply(interaction, warningEmbed(t('mod.alreadyLocked')), true);
      return;
    }

    try {
      await channel.permissionOverwrites.edit(
        everyone,
        { SendMessages: false, SendMessagesInThreads: false, CreatePublicThreads: false },
        { reason: `${interaction.user.tag}: ${reason ?? t('common.noReason')}` }
      );
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })), true);
      return;
    }

    await reply(interaction, successEmbed(t('mod.locked', { channel: `<#${channel.id}>` })));

    if (reason) {
      await channel
        .send({ embeds: [warningEmbed(`🔒 ${reason}`)] })
        .catch(() => null);
    }
  },
});
