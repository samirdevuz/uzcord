"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const reminders_1 = require("../../db/reminders");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
const MAX_ACTIVE = 25;
const MIN_DURATION = 30 * time_1.SECOND;
const MAX_DURATION = 365 * 24 * 60 * 60 * 1000;
exports.default = (0, types_1.defineCommand)({
    category: 'community',
    guildOnly: false,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('remind')
        .setDescription('Eslatmalar')
        .addSubcommand((sub) => sub
        .setName('set')
        .setDescription('Yangi eslatma')
        .addStringOption((opt) => opt.setName('duration').setDescription('Qachon: 10m, 2h, 1d, 1w').setRequired(true))
        .addStringOption((opt) => opt.setName('content').setDescription('Nimani eslatay?').setRequired(true).setMaxLength(1000))
        .addBooleanOption((opt) => opt.setName('here').setDescription('Shu kanalda eslatilsinmi? (standart: shaxsiy xabar)')))
        .addSubcommand((sub) => sub.setName('list').setDescription('Faol eslatmalaringiz'))
        .addSubcommand((sub) => sub
        .setName('cancel')
        .setDescription('Eslatmani bekor qiladi')
        .addIntegerOption((opt) => opt.setName('id').setDescription('Eslatma raqami').setRequired(true).setMinValue(1))),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'set') {
            const durationMs = (0, time_1.parseDuration)(interaction.options.getString('duration', true));
            if (!durationMs || durationMs < MIN_DURATION || durationMs > MAX_DURATION) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('remind.invalidDuration')), true);
                return;
            }
            const active = await (0, reminders_1.getUserReminders)(interaction.user.id);
            if (active.length >= MAX_ACTIVE) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('remind.limit', { max: MAX_ACTIVE })), true);
                return;
            }
            const here = (interaction.options.getBoolean('here') ?? false) && interaction.inGuild();
            const remindAt = Date.now() + durationMs;
            const reminder = await (0, reminders_1.createReminder)({
                guild_id: interaction.guildId,
                channel_id: here ? interaction.channelId : null,
                user_id: interaction.user.id,
                content: interaction.options.getString('content', true),
                remind_at: new Date(remindAt).toISOString(),
            });
            if (!reminder) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('remind.saveFailed')), true);
                return;
            }
            const ts = Math.floor(remindAt / 1000);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('remind.saved', { id: reminder.id, time: `<t:${ts}:R> (<t:${ts}:f>)` })), true);
            return;
        }
        if (subcommand === 'list') {
            const reminders = await (0, reminders_1.getUserReminders)(interaction.user.id);
            if (reminders.length === 0) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('remind.listEmpty')), true);
                return;
            }
            const lines = reminders.map((item) => {
                const ts = Math.floor(new Date(item.remind_at).getTime() / 1000);
                const where = item.channel_id ? `<#${item.channel_id}>` : 'DM';
                return `\`#${item.id}\` <t:${ts}:R> · ${where}\n> ${(0, embeds_1.truncate)(item.content, 150)}`;
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(embeds_1.COLORS.info)
                .setTitle(`⏰ ${t('remind.listTitle')} (${reminders.length})`)
                .setDescription((0, embeds_1.truncate)(lines.join('\n\n'), 4000));
            await interaction.reply({ embeds: [embed], flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const id = interaction.options.getInteger('id', true);
        const deleted = await (0, reminders_1.deleteReminder)(id, interaction.user.id);
        await (0, actions_1.reply)(interaction, deleted ? (0, embeds_1.successEmbed)(t('remind.cancelled', { id })) : (0, embeds_1.errorEmbed)(t('remind.notFound', { id })), true);
    },
});
//# sourceMappingURL=remind.js.map