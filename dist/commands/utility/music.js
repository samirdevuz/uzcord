"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const player_1 = require("../../modules/music/player");
exports.default = (0, types_1.defineCommand)({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('music')
        .setDescription('Musiqa pleyerini boshqarish')
        .addSubcommand((sub) => sub
        .setName('play')
        .setDescription('Ovozli kanalga ulanib musiqa ijro etadi')
        .addStringOption((opt) => opt.setName('url').setDescription('Audio oqimining URL manzili yoki nomi').setRequired(true)))
        .addSubcommand((sub) => sub.setName('pause').setDescription('Ijroni vaqtincha toxtatadi'))
        .addSubcommand((sub) => sub.setName('resume').setDescription('Toxatilgan ijroni davom ettiradi'))
        .addSubcommand((sub) => sub.setName('skip').setDescription('Navbatdagi musiqa turiga otadi'))
        .addSubcommand((sub) => sub.setName('stop').setDescription('Navbatni tozalaydi va ijroni toxtatadi'))
        .addSubcommand((sub) => sub.setName('queue').setDescription('Joriy musiqa navbati'))
        .addSubcommand((sub) => sub.setName('nowplaying').setDescription('Hozir ijro etilayotgan musiqa'))
        .addSubcommand((sub) => sub.setName('leave').setDescription('Ovozli kanaldan chiqadi')),
    category: 'utility',
    async execute(interaction) {
        if (!interaction.guild)
            return;
        const subcommand = interaction.options.getSubcommand();
        const member = interaction.member;
        const voiceChannel = member?.voice?.channel;
        const player = (0, player_1.getGuildPlayer)(interaction.guild.id);
        if (subcommand === 'play') {
            if (!voiceChannel) {
                await interaction.reply({
                    content: "Avval ovozli kanalga qo'shiling!",
                    ephemeral: true,
                });
                return;
            }
            const url = interaction.options.getString('url', true);
            player.join(voiceChannel.id, interaction.guild.voiceAdapterCreator);
            const track = {
                title: url.length > 50 ? url.slice(0, 50) + '...' : url,
                url,
                durationStr: '3:45',
                requestedBy: interaction.user.tag,
            };
            player.addTrack(track);
            await interaction.reply({
                content: `🎵 Navbatga qo'shildi: **${track.title}**`,
            });
            return;
        }
        if (subcommand === 'pause') {
            player.pause();
            await interaction.reply({ content: '⏸ Ijro vaqtincha to\'xtatildi.' });
            return;
        }
        if (subcommand === 'resume') {
            player.resume();
            await interaction.reply({ content: '▶️ Ijro davom ettirildi.' });
            return;
        }
        if (subcommand === 'skip') {
            player.playNext();
            await interaction.reply({ content: '⏭ Navbatdagi trekka o\'tildi.' });
            return;
        }
        if (subcommand === 'stop') {
            player.stop();
            await interaction.reply({ content: '⏹ Ijro to\'xtatildi va navbat tozalandi.' });
            return;
        }
        if (subcommand === 'queue') {
            if (!player.currentTrack && player.queue.length === 0) {
                await interaction.reply({ content: "Navbat bo'sh.", ephemeral: true });
                return;
            }
            const current = player.currentTrack ? `▶️ **${player.currentTrack.title}** (Talab qiluvchi: ${player.currentTrack.requestedBy})\n\n` : '';
            const list = player.queue.map((t, i) => `**${i + 1}.** ${t.title} (${t.requestedBy})`).join('\n');
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('🎶 Musiqa Navbati')
                .setDescription(current + (list || 'Navbatda boshqa trek yo\'q.'))
                .setColor('#3b82f6');
            await interaction.reply({ embeds: [embed] });
            return;
        }
        if (subcommand === 'nowplaying') {
            if (!player.currentTrack) {
                await interaction.reply({ content: "Hozir hech narsa ijro etilmayapti.", ephemeral: true });
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('🎵 Hozir ijro etilmoqda')
                .setDescription(`**${player.currentTrack.title}**\n\nTalab qiluvchi: ${player.currentTrack.requestedBy}`)
                .setColor('#22c55e');
            await interaction.reply({ embeds: [embed] });
            return;
        }
        if (subcommand === 'leave') {
            player.leave();
            await interaction.reply({ content: '👋 Ovozli kanaldan chiqildi.' });
        }
    },
});
//# sourceMappingURL=music.js.map