import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type TextChannel } from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';
import { formatDuration, parseDuration } from '../../utils/time';

const MAX_SLOWMODE = 21600; // Discord chegarasi: 6 soat

export default defineCommand({
  category: 'moderation',
  botPermissions: [PermissionFlagsBits.ManageChannels],
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription("Kanalda sekin rejimni o'rnatadi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription("Masalan: 10s, 2m, 1h. O'chirish uchun: 0")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription("Kanal (bo'sh = joriy kanal)")
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const raw = interaction.options.getString('duration', true).trim();
    const channel = (interaction.options.getChannel('channel') ??
      interaction.channel) as TextChannel | null;

    if (!channel || channel.type !== ChannelType.GuildText) {
      await reply(interaction, errorEmbed(t('error.channelType')), true);
      return;
    }

    let seconds: number;
    if (raw === '0' || raw.toLowerCase() === 'off') {
      seconds = 0;
    } else {
      const ms = parseDuration(raw);
      if (ms === null) {
        await reply(interaction, errorEmbed(t('error.invalidDuration')), true);
        return;
      }
      seconds = Math.min(Math.floor(ms / 1000), MAX_SLOWMODE);
    }

    try {
      await channel.setRateLimitPerUser(seconds, `${interaction.user.tag}`);
    } catch (error) {
      await reply(interaction, errorEmbed(t('error.actionFailed', { details: String(error) })), true);
      return;
    }

    const message =
      seconds === 0
        ? t('mod.slowmodeOff', { channel: `<#${channel.id}>` })
        : t('mod.slowmodeSet', {
            channel: `<#${channel.id}>`,
            duration: formatDuration(seconds * 1000),
          });

    await reply(interaction, successEmbed(message));
  },
});
