import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { defineCommand } from '../../core/types';
import { createReminder, deleteReminder, getUserReminders } from '../../db/reminders';
import { parseDuration } from '../../utils/time';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Eslatma o\'rnatish va boshqarish')
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('Yangi eslatma yaratadi')
        .addStringOption((opt) => opt.setName('content').setDescription('Eslatma matni').setRequired(true))
        .addStringOption((opt) => opt.setName('duration').setDescription('Qancha vaqtdan so\'ng (masalan: 10m, 1h, 2d)').setRequired(true))
        .addBooleanOption((opt) => opt.setName('channel').setDescription('Ushbu kanalda eslatilsinmi? (Standart: DM)'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Aktiv eslatmalaringiz ro\'yxati')
    )
    .addSubcommand((sub) =>
      sub
        .setName('cancel')
        .setDescription('Eslatmani bekor qiladi')
        .addIntegerOption((opt) => opt.setName('id').setDescription('Eslatma IDsi').setRequired(true))
    ),
  category: 'utility',

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set') {
      const content = interaction.options.getString('content', true);
      const durationStr = interaction.options.getString('duration', true);
      const inChannel = interaction.options.getBoolean('channel') ?? false;

      const durationMs = parseDuration(durationStr);
      if (!durationMs || durationMs < 30_000) {
        await interaction.reply({
          content: "Noto'g'ri muddat kiritildi. Eng kamida `30s` (30 soniya) bo'lishi kerak. Masalan: `10m`, `2h`, `1d`.",
          ephemeral: true,
        });
        return;
      }

      const remindAt = new Date(Date.now() + durationMs).toISOString();

      const reminder = await createReminder({
        guild_id: interaction.guildId,
        channel_id: inChannel ? interaction.channelId : null,
        user_id: interaction.user.id,
        content,
        remind_at: remindAt,
      });

      if (!reminder) {
        await interaction.reply({ content: "Eslatmani saqlab bo'lmadi.", ephemeral: true });
        return;
      }

      const timestamp = Math.floor(Date.now() / 1000 + durationMs / 1000);
      await interaction.reply({
        content: `⏰ Eslatma saqlandi! ID: \`#${reminder.id}\` — <t:${timestamp}:R> sizga eslatiladi.`,
        ephemeral: true,
      });
      return;
    }

    if (subcommand === 'list') {
      const reminders = await getUserReminders(interaction.user.id);
      if (reminders.length === 0) {
        await interaction.reply({
          content: "Sizda faol eslatmalar mavjud emas.",
          ephemeral: true,
        });
        return;
      }

      const lines = reminders.map((r) => {
        const ts = Math.floor(new Date(r.remind_at).getTime() / 1000);
        return `\`#${r.id}\` — **"${r.content}"** (<t:${ts}:R>)`;
      });

      const embed = new EmbedBuilder()
        .setTitle('⏰ Sizning eslatmalaringiz')
        .setDescription(lines.join('\n'))
        .setColor('#3b82f6')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (subcommand === 'cancel') {
      const id = interaction.options.getInteger('id', true);
      const deleted = await deleteReminder(id, interaction.user.id);

      if (!deleted) {
        await interaction.reply({
          content: `Eslatma #${id} topilmadi yoki bu sizning eslatmangiz emas.`,
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: `✅ Eslatma #${id} bekor qilindi.`,
        ephemeral: true,
      });
    }
  },
});
