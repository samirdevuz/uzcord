import { ChannelType, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { reply } from '../../modules/moderation/actions';
import { brandEmbed } from '../../utils/embeds';
import { fullDate } from '../../utils/time';

export default defineCommand({
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription("Server haqida ma'lumot beradi")
    .setDMPermission(false),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const owner = await guild.fetchOwner().catch(() => null);

    const channels = guild.channels.cache;
    const text = channels.filter((channel) => channel.type === ChannelType.GuildText).size;
    const voice = channels.filter((channel) => channel.type === ChannelType.GuildVoice).size;
    const categories = channels.filter((channel) => channel.type === ChannelType.GuildCategory).size;

    const embed = brandEmbed(t('util.serverInfoTitle', { guild: guild.name }))
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: t('util.owner'), value: owner ? `<@${owner.id}>` : t('common.none'), inline: true },
        { name: t('util.members'), value: String(guild.memberCount), inline: true },
        { name: 'ID', value: `\`${guild.id}\``, inline: true },
        {
          name: t('util.channels'),
          value: `💬 ${text} · 🔊 ${voice} · 📁 ${categories}`,
          inline: true,
        },
        { name: t('util.roles'), value: String(guild.roles.cache.size - 1), inline: true },
        { name: t('util.emojis'), value: String(guild.emojis.cache.size), inline: true },
        {
          name: t('util.boosts'),
          value: `${guild.premiumSubscriptionCount ?? 0} (Level ${guild.premiumTier})`,
          inline: true,
        },
        { name: t('util.createdAt'), value: fullDate(guild.createdTimestamp), inline: true }
      );

    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));

    await reply(interaction, embed);
  },
});
