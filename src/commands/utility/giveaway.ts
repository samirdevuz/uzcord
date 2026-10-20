import { ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, type TextChannel } from 'discord.js';
import { defineCommand } from '../../core/types';
import { createGiveaway, getGiveawayByMessage } from '../../db/giveaways';
import {
  buildGiveawayEmbed,
  finishGiveaway,
  giveawayComponents,
  rerollGiveaway,
} from '../../modules/giveaways';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';
import { DAY, MINUTE, parseDuration } from '../../utils/time';

const MAX_DURATION = 30 * DAY;

/** Xabar havolasi yoki ID dan xabar IDsini ajratib oladi. */
function messageIdFrom(input: string): string {
  return input.trim().split('/').pop()!.replace(/\D/g, '');
}

export default defineCommand({
  category: 'utility',
  botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Konkurs (giveaway) yaratish va boshqarish')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Yangi konkurs boshlaydi')
        .addStringOption((opt) => opt.setName('prize').setDescription('Yutuq').setRequired(true).setMaxLength(200))
        .addStringOption((opt) => opt.setName('duration').setDescription('Davomiyligi: 30m, 2h, 1d (ko\'pi bilan 30 kun)').setRequired(true))
        .addIntegerOption((opt) => opt.setName('winners').setDescription("G'oliblar soni").setMinValue(1).setMaxValue(20))
        .addChannelOption((opt) => opt.setName('channel').setDescription('Kanal').addChannelTypes(ChannelType.GuildText))
        .addRoleOption((opt) => opt.setName('required_role').setDescription('Qatnashish uchun kerakli rol'))
        .addStringOption((opt) => opt.setName('description').setDescription('Tavsif').setMaxLength(1000))
    )
    .addSubcommand((sub) =>
      sub
        .setName('end')
        .setDescription('Konkursni muddatidan oldin yakunlaydi')
        .addStringOption((opt) => opt.setName('message').setDescription('Konkurs xabarining IDsi yoki havolasi').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('reroll')
        .setDescription("Yakunlangan konkurs uchun yangi g'olib tanlaydi")
        .addStringOption((opt) => opt.setName('message').setDescription('Konkurs xabarining IDsi yoki havolasi').setRequired(true))
        .addIntegerOption((opt) => opt.setName('winners').setDescription("Nechta yangi g'olib").setMinValue(1).setMaxValue(10))
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const prize = interaction.options.getString('prize', true);
      const durationMs = parseDuration(interaction.options.getString('duration', true));
      const winnerCount = interaction.options.getInteger('winners') ?? 1;
      const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel | null;
      const role = interaction.options.getRole('required_role');
      const description = interaction.options.getString('description');

      if (!durationMs || durationMs < MINUTE || durationMs > MAX_DURATION) {
        await reply(interaction, errorEmbed(t('giveaway.invalidDuration')), true);
        return;
      }
      if (!channel || channel.type !== ChannelType.GuildText) {
        await reply(interaction, errorEmbed(t('error.channelType')), true);
        return;
      }
      const me = guild.members.me!;
      if (!channel.permissionsFor(me)?.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
        await reply(interaction, errorEmbed(t('giveaway.noPermission', { channel: `<#${channel.id}>` })), true);
        return;
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const draft = {
        guild_id: guild.id,
        channel_id: channel.id,
        message_id: null as string | null,
        prize,
        description,
        winner_count: winnerCount,
        host_id: interaction.user.id,
        required_role_id: role?.id ?? null,
        required_level: null,
        ends_at: new Date(Date.now() + durationMs).toISOString(),
      };
      const preview = { ...draft, id: 0, ended: false, winners: [], created_at: new Date().toISOString() };

      const message = await channel.send({
        embeds: [buildGiveawayEmbed(preview, t, { entries: 0, ended: false })],
        components: giveawayComponents(t, 0, false),
      });
      const saved = await createGiveaway({ ...draft, message_id: message.id });
      if (!saved) {
        await message.delete().catch(() => null);
        await reply(interaction, errorEmbed(t('error.generic')));
        return;
      }
      await reply(interaction, successEmbed(t('giveaway.created', { channel: `<#${channel.id}>` })));
      return;
    }

    const giveaway = await getGiveawayByMessage(messageIdFrom(interaction.options.getString('message', true)));
    if (!giveaway || giveaway.guild_id !== guild.id) {
      await reply(interaction, errorEmbed(t('giveaway.notFound')), true);
      return;
    }

    if (subcommand === 'end') {
      if (giveaway.ended) {
        await reply(interaction, errorEmbed(t('giveaway.ended')), true);
        return;
      }
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const winners = await finishGiveaway(interaction.client, giveaway);
      await reply(interaction, successEmbed(winners ? t('giveaway.endedManual') : t('giveaway.ended')));
      return;
    }

    // reroll
    if (!giveaway.ended) {
      await reply(interaction, errorEmbed(t('giveaway.notEnded')), true);
      return;
    }
    const fresh = await rerollGiveaway(giveaway, interaction.options.getInteger('winners') ?? 1);
    if (fresh.length === 0) {
      await reply(interaction, errorEmbed(t('giveaway.noReroll')), true);
      return;
    }
    await interaction.reply({
      content: t('giveaway.rerolled', { winners: fresh.map((id) => `<@${id}>`).join(', '), prize: giveaway.prize }),
      allowedMentions: { users: fresh },
    });
  },
});
