"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const giveaways_1 = require("../../db/giveaways");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Konkurs (giveaway) yaratish va boshqarish')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .addSubcommand((sub) => sub
        .setName('create')
        .setDescription('Yangi konkurs yaratadi')
        .addStringOption((opt) => opt.setName('prize').setDescription('Yutuq').setRequired(true))
        .addStringOption((opt) => opt.setName('duration').setDescription('Davomiyligi (masalan: 1h, 1d, 30m)').setRequired(true))
        .addIntegerOption((opt) => opt.setName('winners').setDescription("G'oliblar soni (standart: 1)").setMinValue(1).setMaxValue(20))
        .addChannelOption((opt) => opt.setName('channel').setDescription('Kanal').addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addRoleOption((opt) => opt.setName('required_role').setDescription('Talab qilinadigan rol'))
        .addStringOption((opt) => opt.setName('description').setDescription('Tavsif')))
        .addSubcommand((sub) => sub
        .setName('end')
        .setDescription('Konkursni muddatidan oldin yakunlaydi')
        .addStringOption((opt) => opt.setName('message_id').setDescription('Konkurs xabarining IDsi').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('reroll')
        .setDescription("Yangi g'olibni qayta tanlaydi")
        .addStringOption((opt) => opt.setName('message_id').setDescription('Konkurs xabarining IDsi').setRequired(true))),
    category: 'utility',
    async execute(interaction) {
        if (!interaction.guild)
            return;
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'create') {
            const prize = interaction.options.getString('prize', true);
            const durationStr = interaction.options.getString('duration', true);
            const winnerCount = interaction.options.getInteger('winners') ?? 1;
            const targetChannel = (interaction.options.getChannel('channel') ?? interaction.channel);
            const reqRole = interaction.options.getRole('required_role');
            const description = interaction.options.getString('description');
            const durationMs = (0, time_1.parseDuration)(durationStr);
            if (!durationMs || durationMs < 60_000) {
                await interaction.reply({
                    content: "Noto'g'ri muddat kiritildi. Eng kamida `1m` (1 daqiqa) bo'lishi kerak. Masalan: `30m`, `2h`, `1d`.",
                    ephemeral: true,
                });
                return;
            }
            const endsAt = new Date(Date.now() + durationMs).toISOString();
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`🎉 KONKURS: ${prize}`)
                .setDescription((description ? `${description}\n\n` : '') +
                `**G'oliblar:** ${winnerCount} ta\n` +
                `**Tashkilotchi:** <@${interaction.user.id}>\n` +
                (reqRole ? `**Kerakli rol:** ${reqRole}\n` : '') +
                `**Tugash vaqti:** <t:${Math.floor(Date.now() / 1000 + durationMs / 1000)}:R>`)
                .setColor('#ec4899')
                .setFooter({ text: "Qatnashish uchun pastdagi 🎉 tugmasini bosing!" })
                .setTimestamp(new Date(Date.now() + durationMs));
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('giveaway_enter')
                .setLabel('Qatnashish')
                .setEmoji('🎉')
                .setStyle(discord_js_1.ButtonStyle.Success));
            const msg = await targetChannel.send({ embeds: [embed], components: [row] });
            await (0, giveaways_1.createGiveaway)({
                guild_id: interaction.guild.id,
                channel_id: targetChannel.id,
                message_id: msg.id,
                prize,
                description,
                winner_count: winnerCount,
                host_id: interaction.user.id,
                required_role_id: reqRole?.id ?? null,
                required_level: null,
                ends_at: endsAt,
            });
            await interaction.reply({
                content: `✅ Konkurs ${targetChannel} kanalida boshlandi!`,
                ephemeral: true,
            });
            return;
        }
        if (subcommand === 'end') {
            const messageId = interaction.options.getString('message_id', true);
            const giveaway = await (0, giveaways_1.getGiveawayByMessage)(messageId);
            if (!giveaway || giveaway.guild_id !== interaction.guild.id) {
                await interaction.reply({ content: 'Konkurs topilmadi.', ephemeral: true });
                return;
            }
            if (giveaway.ended) {
                await interaction.reply({ content: 'Bu konkurs allaqachon yakunlangan.', ephemeral: true });
                return;
            }
            const entries = await (0, giveaways_1.getGiveawayEntries)(giveaway.id);
            const winners = [];
            if (entries.length > 0) {
                const pool = [...entries];
                const count = Math.min(giveaway.winner_count, pool.length);
                for (let i = 0; i < count; i++) {
                    const randomIndex = Math.floor(Math.random() * pool.length);
                    winners.push(pool.splice(randomIndex, 1)[0]);
                }
            }
            await (0, giveaways_1.endGiveaway)(giveaway.id, winners);
            const winnersText = winners.length > 0 ? winners.map((w) => `<@${w}>`).join(', ') : "Ishtirokchilar bo'lmadi";
            await interaction.reply({
                content: `🎉 Konkurs yakunlandi!\n**G'oliblar:** ${winnersText}`,
            });
            return;
        }
        if (subcommand === 'reroll') {
            const messageId = interaction.options.getString('message_id', true);
            const giveaway = await (0, giveaways_1.getGiveawayByMessage)(messageId);
            if (!giveaway || giveaway.guild_id !== interaction.guild.id) {
                await interaction.reply({ content: 'Konkurs topilmadi.', ephemeral: true });
                return;
            }
            const entries = await (0, giveaways_1.getGiveawayEntries)(giveaway.id);
            if (entries.length === 0) {
                await interaction.reply({ content: "Ishtirokchilar bo'lmagan.", ephemeral: true });
                return;
            }
            const randomWinner = entries[Math.floor(Math.random() * entries.length)];
            await interaction.reply({
                content: `🎉 Yangi g'olib qayta tanlandi: <@${randomWinner}>! Tabriklaymiz!`,
            });
        }
    },
});
//# sourceMappingURL=giveaway.js.map