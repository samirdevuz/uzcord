import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../core/types';
import { createReminder, deleteReminder, getUserReminders } from '../../db/reminders';
import { reply } from '../../modules/moderation/actions';
import { COLORS, errorEmbed, successEmbed, truncate } from '../../utils/embeds';
import { parseDuration, SECOND } from '../../utils/time';

const MAX_ACTIVE = 25;
const MIN_DURATION = 30 * SECOND;
const MAX_DURATION = 365 * 24 * 60 * 60 * 1000;

export default defineCommand({
  category: 'community',
  guildOnly: false,
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Eslatmalar')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Yangi eslatma')
        .addStringOption((opt) => opt.setName('duration').setDescription('Qachon: 10m, 2h, 1d, 1w').setRequired(true))
        .addStringOption((opt) => opt.setName('content').setDescription('Nimani eslatay?').setRequired(true).setMaxLength(1000))
        .addBooleanOption((opt) => opt.setName('here').setDescription('Shu kanalda eslatilsinmi? (standart: shaxsiy xabar)'))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('Faol eslatmalaringiz'))
    .addSubcommand((sub) =>
      sub
        .setName('cancel')
        .setDescription('Eslatmani bekor qiladi')
        .addIntegerOption((opt) => opt.setName('id').setDescription('Eslatma raqami').setRequired(true).setMinValue(1))
    ),

  async execute(interaction, ctx) {
    const { t } = ctx;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set') {
      const durationMs = parseDuration(interaction.options.getString('duration', true));
      if (!durationMs || durationMs < MIN_DURATION || durationMs > MAX_DURATION) {
        await reply(interaction, errorEmbed(t('remind.invalidDuration')), true);
        return;
      }
      const active = await getUserReminders(interaction.user.id);
      if (active.length >= MAX_ACTIVE) {
        await reply(interaction, errorEmbed(t('remind.limit', { max: MAX_ACTIVE })), true);
        return;
      }

      const here = (interaction.options.getBoolean('here') ?? false) && interaction.inGuild();
      const remindAt = Date.now() + durationMs;
      const reminder = await createReminder({
        guild_id: interaction.guildId,
        channel_id: here ? interaction.channelId : null,
        user_id: interaction.user.id,
        content: interaction.options.getString('content', true),
        remind_at: new Date(remindAt).toISOString(),
      });
      if (!reminder) {
        await reply(interaction, errorEmbed(t('remind.saveFailed')), true);
        return;
      }

      const ts = Math.floor(remindAt / 1000);
      await reply(interaction, successEmbed(t('remind.saved', { id: reminder.id, time: `<t:${ts}:R> (<t:${ts}:f>)` })), true);
      return;
    }

    if (subcommand === 'list') {
      const reminders = await getUserReminders(interaction.user.id);
      if (reminders.length === 0) {
        await reply(interaction, errorEmbed(t('remind.listEmpty')), true);
        return;
      }
      const lines = reminders.map((item) => {
        const ts = Math.floor(new Date(item.remind_at).getTime() / 1000);
        const where = item.channel_id ? `<#${item.channel_id}>` : 'DM';
        return `\`#${item.id}\` <t:${ts}:R> · ${where}\n> ${truncate(item.content, 150)}`;
      });
      const embed = new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle(`⏰ ${t('remind.listTitle')} (${reminders.length})`)
        .setDescription(truncate(lines.join('\n\n'), 4000));
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    const id = interaction.options.getInteger('id', true);
    const deleted = await deleteReminder(id, interaction.user.id);
    await reply(
      interaction,
      deleted ? successEmbed(t('remind.cancelled', { id })) : errorEmbed(t('remind.notFound', { id })),
      true
    );
  },
});
