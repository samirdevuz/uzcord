import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type TextChannel } from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed, warningEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription("Yopilgan kanalni qayta ochadi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription("Kanal (bo'sh = joriy kanal)")
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const channel = (interaction.options.getChannel('channel') ??
      interaction.channel) as TextChannel | null;

    if (!channel || channel.type !== ChannelType.GuildText) {
      await reply(interaction, errorEmbed(t('error.channelType')), true);
      return;
    }

    const everyone = guild.roles.everyone;
    const current = channel.permissionOverwrites.cache.get(everyone.id);
    if (!current?.deny.has(PermissionFlagsBits.SendMessages)) {
      await reply(interaction, warningEmbed(t('mod.alreadyUnlocked')), true);
      return;
    }

    try {
      await channel.permissionOverwrites.edit(
        everyone,
        { SendMessages: null, SendMessagesInThreads: null, CreatePublicThreads: null },
        { reason: `${interaction.user.tag}` }
      );
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })), true);
      return;
    }

    await reply(interaction, successEmbed(t('mod.unlocked', { channel: `<#${channel.id}>` })));
  },
});
