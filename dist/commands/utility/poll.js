"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const polls_1 = require("../../db/polls");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('poll')
        .setDescription('Professional so\'rovnoma yaratish')
        .addStringOption((opt) => opt.setName('question').setDescription('Savol').setRequired(true))
        .addStringOption((opt) => opt.setName('option1').setDescription('1-variant').setRequired(true))
        .addStringOption((opt) => opt.setName('option2').setDescription('2-variant').setRequired(true))
        .addStringOption((opt) => opt.setName('option3').setDescription('3-variant'))
        .addStringOption((opt) => opt.setName('option4').setDescription('4-variant'))
        .addStringOption((opt) => opt.setName('duration').setDescription('Davomiyligi (masalan: 1h, 1d, 30m)'))
        .addBooleanOption((opt) => opt.setName('multi').setDescription('Kop tanlovli (multi-choice)?')),
    category: 'utility',
    async execute(interaction) {
        if (!interaction.guild)
            return;
        const question = interaction.options.getString('question', true);
        const opt1 = interaction.options.getString('option1', true);
        const opt2 = interaction.options.getString('option2', true);
        const opt3 = interaction.options.getString('option3');
        const opt4 = interaction.options.getString('option4');
        const durationStr = interaction.options.getString('duration');
        const multi = interaction.options.getBoolean('multi') ?? false;
        const rawOptions = [opt1, opt2, opt3, opt4].filter(Boolean);
        const options = rawOptions.map((label, idx) => ({ key: `opt_${idx + 1}`, label }));
        let endsAt = null;
        let durationMs = null;
        if (durationStr) {
            durationMs = (0, time_1.parseDuration)(durationStr);
            if (durationMs) {
                endsAt = new Date(Date.now() + durationMs).toISOString();
            }
        }
        const optionsText = options.map((opt, i) => `**${i + 1}.** ${opt.label}`).join('\n');
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`📊 So'rovnoma: ${question}`)
            .setDescription(optionsText +
            `\n\n*${multi ? 'Bir nechta tanlovga ruxsat berilgan' : 'Faqat bitta tanlov mumkin'}*` +
            (durationMs ? `\n\n**Tugash vaqti:** <t:${Math.floor(Date.now() / 1000 + durationMs / 1000)}:R>` : ''))
            .setColor('#6366f1')
            .setFooter({ text: `Tashkilotchi: ${interaction.user.tag}` })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder();
        options.forEach((opt, idx) => {
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`poll_vote:${opt.key}`)
                .setLabel(`${idx + 1}-variant`)
                .setStyle(discord_js_1.ButtonStyle.Primary));
        });
        const targetChannel = interaction.channel;
        const msg = await targetChannel.send({ embeds: [embed], components: [row] });
        await (0, polls_1.createPoll)({
            guild_id: interaction.guild.id,
            channel_id: targetChannel.id,
            message_id: msg.id,
            question,
            options,
            multi,
            ends_at: endsAt,
            created_by: interaction.user.id,
        });
        await interaction.reply({
            content: "✅ So'rovnoma muvaffaqiyatli yaratildi!",
            ephemeral: true,
        });
    },
});
//# sourceMappingURL=poll.js.map