import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, type GuildMember } from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { COLORS, errorEmbed, truncate } from '../../utils/embeds';
import { parseMessageReference } from '../../utils/validation';

export default defineCommand({
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Xabardan chiroyli iqtibos keltiradi')
    .setDMPermission(false)
    .addStringOption((opt) =>
      opt.setName('message').setDescription('Xabar havolasi (Copy Message Link) yoki shu kanaldagi xabar IDsi').setRequired(true)
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const ref = parseMessageReference(interaction.options.getString('message', true));
    if (!ref) {
      await reply(interaction, errorEmbed(t('quote.notFound')), true);
      return;
    }

    const channel = ref.channelId ? await guild.channels.fetch(ref.channelId).catch(() => null) : interaction.channel;
    if (!channel?.isTextBased() || channel.isDMBased() || channel.guildId !== guild.id) {
      await reply(interaction, errorEmbed(t('quote.notFound')), true);
      return;
    }

    // Foydalanuvchi o'zi ko'ra olmaydigan kanaldan iqtibos keltira olmasin.
    const member = interaction.member as GuildMember;
    if (!channel.permissionsFor(member)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory])) {
      await reply(interaction, errorEmbed(t('quote.notFound')), true);
      return;
    }

    const message = await channel.messages.fetch(ref.messageId).catch(() => null);
    if (!message) {
      await reply(interaction, errorEmbed(t('quote.notFound')), true);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(message.member?.displayColor || COLORS.info)
      .setAuthor({ name: message.member?.displayName ?? message.author.username, iconURL: message.author.displayAvatarURL() })
      .setDescription(truncate(message.content || message.embeds[0]?.description || t('quote.mediaOnly'), 4000))
      .addFields({ name: '​', value: `[${t('quote.jump')}](${message.url}) · <#${channel.id}>` })
      .setFooter({ text: t('quote.by', { user: interaction.user.username }) })
      .setTimestamp(message.createdAt);

    const image = message.attachments.find((attachment) => attachment.contentType?.startsWith('image/'));
    if (image) embed.setImage(image.url);

    await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
  },
});
