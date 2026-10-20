import { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { getStarboardSettings, updateStarboardSettings } from '../../db/starboard';
import { invalidateStarboardSettings } from '../../modules/starboard';
import { reply } from '../../modules/moderation/actions';
import { COLORS, errorEmbed, successEmbed } from '../../utils/embeds';

export default defineCommand({
  category: 'config',
  data: new SlashCommandBuilder()
    .setName('starboard')
    .setDescription("Starboard — eng ko'p reaksiya olgan xabarlar kanali")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('setup')
        .setDescription('Starboardni sozlaydi va yoqadi')
        .addChannelOption((opt) =>
          opt.setName('channel').setDescription('Starboard kanali').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addIntegerOption((opt) => opt.setName('threshold').setDescription('Nechta reaksiyada chiqsin (standart 3)').setMinValue(1).setMaxValue(100))
        .addStringOption((opt) => opt.setName('emoji').setDescription('Reaksiya emojisi (standart ⭐)').setMaxLength(64))
        .addBooleanOption((opt) => opt.setName('self_star').setDescription("Muallif o'z xabariga ovoz bera oladimi?"))
    )
    .addSubcommand((sub) =>
      sub
        .setName('enable')
        .setDescription("Starboardni yoqadi yoki o'chiradi")
        .addBooleanOption((opt) => opt.setName('value').setDescription('Yoqilsinmi?').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('ignore')
        .setDescription("Kanalni e'tiborsizlar ro'yxatiga qo'shadi yoki olib tashlaydi")
        .addChannelOption((opt) =>
          opt.setName('channel').setDescription('Kanal').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName('status').setDescription('Joriy sozlamalar')),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const subcommand = interaction.options.getSubcommand();
    const settings = await getStarboardSettings(guild.id);

    const save = async (patch: Parameters<typeof updateStarboardSettings>[1]) => {
      await updateStarboardSettings(guild.id, patch);
      invalidateStarboardSettings(guild.id);
    };

    if (subcommand === 'setup') {
      const channel = interaction.options.getChannel('channel', true);
      const me = guild.members.me!;
      const permissions = guild.channels.cache.get(channel.id)?.permissionsFor(me);
      if (!permissions?.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
        await reply(interaction, errorEmbed(t('error.botMissingPermission', { permissions: 'SendMessages, EmbedLinks' })), true);
        return;
      }
      await save({
        enabled: true,
        channel_id: channel.id,
        threshold: interaction.options.getInteger('threshold') ?? settings.threshold,
        emoji: interaction.options.getString('emoji')?.trim() || settings.emoji,
        allow_self_star: interaction.options.getBoolean('self_star') ?? settings.allow_self_star,
      });
      await reply(interaction, successEmbed(t('starboard.configured', { channel: `<#${channel.id}>` })));
      return;
    }

    if (subcommand === 'enable') {
      const value = interaction.options.getBoolean('value', true);
      if (value && !settings.channel_id) {
        await reply(interaction, errorEmbed(t('starboard.noChannel')), true);
        return;
      }
      await save({ enabled: value });
      await reply(interaction, successEmbed(t(value ? 'starboard.enabled' : 'starboard.disabled')));
      return;
    }

    if (subcommand === 'ignore') {
      const channel = interaction.options.getChannel('channel', true);
      const list = new Set(settings.ignored_channels);
      const added = !list.has(channel.id);
      if (added) list.add(channel.id);
      else list.delete(channel.id);
      await save({ ignored_channels: [...list] });
      await reply(
        interaction,
        successEmbed(t(added ? 'starboard.ignoreAdded' : 'starboard.ignoreRemoved', { channel: `<#${channel.id}>` })),
        true
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle('⭐ Starboard')
      .addFields(
        { name: t('starboard.fieldEnabled'), value: settings.enabled ? '✅' : '❌', inline: true },
        { name: t('starboard.fieldChannel'), value: settings.channel_id ? `<#${settings.channel_id}>` : '—', inline: true },
        { name: t('starboard.fieldEmoji'), value: settings.emoji, inline: true },
        { name: t('starboard.fieldThreshold'), value: String(settings.threshold), inline: true },
        { name: t('starboard.fieldSelfStar'), value: settings.allow_self_star ? '✅' : '❌', inline: true },
        {
          name: t('starboard.fieldIgnored'),
          value: settings.ignored_channels.length > 0 ? settings.ignored_channels.map((id) => `<#${id}>`).join(' ') : '—',
        }
      );
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
});
