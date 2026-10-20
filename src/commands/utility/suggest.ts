import {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type TextChannel,
} from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';

/** Takliflar kanali nomi bo'yicha topiladi (masalan #takliflar yoki #suggestions). */
const CHANNEL_HINTS = ['takliflar', 'taklif', 'suggestions', 'suggestion', 'предложения'];

export default defineCommand({
  category: 'utility',
  cooldown: 60,
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Server uchun taklif yuboradi')
    .setDMPermission(false)
    .addStringOption((opt) => opt.setName('text').setDescription('Taklif matni').setRequired(true).setMinLength(10).setMaxLength(2000)),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const me = guild.members.me!;
    const text = interaction.options.getString('text', true);

    const named = guild.channels.cache.find(
      (channel): channel is TextChannel =>
        channel.type === ChannelType.GuildText && CHANNEL_HINTS.some((hint) => channel.name.toLowerCase().includes(hint))
    );
    const target = (named ?? interaction.channel) as TextChannel | null;
    if (!target || target.type !== ChannelType.GuildText) {
      await reply(interaction, errorEmbed(t('error.channelType')), true);
      return;
    }
    const permissions = target.permissionsFor(me);
    if (!permissions?.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AddReactions])) {
      await reply(interaction, errorEmbed(t('error.botMissingPermission', { permissions: 'SendMessages, EmbedLinks, AddReactions' })), true);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`💡 ${t('suggest.title')}`)
      .setDescription(text)
      .setFooter({ text: t('suggest.footer') })
      .setTimestamp();

    const message = await target.send({ embeds: [embed] });
    await message.react('👍').catch(() => null);
    await message.react('👎').catch(() => null);
    if (permissions.has(PermissionFlagsBits.CreatePublicThreads)) {
      await message
        .startThread({ name: `💬 ${text.slice(0, 80)}`, autoArchiveDuration: 10080 })
        .catch(() => null);
    }

    await interaction.reply({
      embeds: [successEmbed(t('suggest.sent', { link: message.url }))],
      flags: MessageFlags.Ephemeral,
    });
  },
});
