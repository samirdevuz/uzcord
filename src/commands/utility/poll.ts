import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { createPoll } from '../../db/polls';
import { buildPollEmbed, pollComponents } from '../../modules/polls';
import { reply } from '../../modules/moderation/actions';
import { errorEmbed, successEmbed } from '../../utils/embeds';
import { DAY, MINUTE, parseDuration } from '../../utils/time';

const MAX_DURATION = 30 * DAY;

export default defineCommand({
  category: 'community',
  cooldown: 10,
  botPermissions: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription("So'rovnoma yaratadi (tugmalar orqali ovoz berish)")
    .setDMPermission(false)
    .addStringOption((opt) => opt.setName('question').setDescription('Savol').setRequired(true).setMaxLength(250))
    .addStringOption((opt) => opt.setName('option1').setDescription('1-variant').setRequired(true).setMaxLength(100))
    .addStringOption((opt) => opt.setName('option2').setDescription('2-variant').setRequired(true).setMaxLength(100))
    .addStringOption((opt) => opt.setName('option3').setDescription('3-variant').setMaxLength(100))
    .addStringOption((opt) => opt.setName('option4').setDescription('4-variant').setMaxLength(100))
    .addStringOption((opt) => opt.setName('option5').setDescription('5-variant').setMaxLength(100))
    .addStringOption((opt) => opt.setName('duration').setDescription('Davomiyligi: 30m, 2h, 1d (bo\'sh = cheksiz)'))
    .addBooleanOption((opt) => opt.setName('multi').setDescription('Bir nechta variant tanlash mumkinmi?')),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const channel = interaction.channel;
    if (!channel?.isTextBased() || channel.isDMBased()) {
      await reply(interaction, errorEmbed(t('error.channelType')), true);
      return;
    }

    const question = interaction.options.getString('question', true);
    const labels = ['option1', 'option2', 'option3', 'option4', 'option5']
      .map((name) => interaction.options.getString(name)?.trim())
      .filter((label): label is string => Boolean(label));

    if (new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
      await reply(interaction, errorEmbed(t('poll.duplicateOptions')), true);
      return;
    }

    let endsAt: string | null = null;
    const durationInput = interaction.options.getString('duration');
    if (durationInput) {
      const durationMs = parseDuration(durationInput);
      if (!durationMs || durationMs < MINUTE || durationMs > MAX_DURATION) {
        await reply(interaction, errorEmbed(t('poll.invalidDuration')), true);
        return;
      }
      endsAt = new Date(Date.now() + durationMs).toISOString();
    }

    const options = labels.map((label, index) => ({ key: `opt_${index + 1}`, label }));
    const draft = {
      guild_id: interaction.guildId!,
      channel_id: channel.id,
      question,
      options,
      multi: interaction.options.getBoolean('multi') ?? false,
      ends_at: endsAt,
      created_by: interaction.user.id,
    };

    const embed = buildPollEmbed(draft, [], t, false).setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.displayAvatarURL(),
    });
    const message = await channel.send({ embeds: [embed], components: pollComponents(options, false) });

    const saved = await createPoll({ ...draft, message_id: message.id });
    if (!saved) {
      await message.delete().catch(() => null);
      await reply(interaction, errorEmbed(t('error.generic')), true);
      return;
    }
    await interaction.reply({ embeds: [successEmbed(t('poll.created'))], flags: MessageFlags.Ephemeral });
  },
});
