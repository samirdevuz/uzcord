"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const player_1 = require("../../modules/music/player");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const LOOP_LABEL_KEYS = { off: 'music.loopOff', track: 'music.loopTrack', queue: 'music.loopQueue' };
exports.default = (0, types_1.defineCommand)({
    category: 'music',
    cooldown: 2,
    botPermissions: [discord_js_1.PermissionFlagsBits.Connect, discord_js_1.PermissionFlagsBits.Speak],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('music')
        .setDescription('Musiqa pleyeri: audio havolalar va internet-radio')
        .setDMPermission(false)
        .addSubcommand((sub) => sub
        .setName('play')
        .setDescription("Audio havola yoki radio oqimini ijro etadi / navbatga qo'shadi")
        .addStringOption((opt) => opt.setName('url').setDescription('To\'g\'ridan-to\'g\'ri audio havola (mp3, ogg, m4a...) yoki radio oqimi').setRequired(true)))
        .addSubcommand((sub) => sub.setName('pause').setDescription("Ijroni vaqtincha to'xtatadi"))
        .addSubcommand((sub) => sub.setName('resume').setDescription('Ijroni davom ettiradi'))
        .addSubcommand((sub) => sub.setName('skip').setDescription("Keyingi trekka o'tadi"))
        .addSubcommand((sub) => sub.setName('stop').setDescription("Ijroni to'xtatadi va navbatni tozalaydi"))
        .addSubcommand((sub) => sub.setName('queue').setDescription('Navbatni ko\'rsatadi'))
        .addSubcommand((sub) => sub.setName('nowplaying').setDescription('Hozir ijro etilayotgan trek'))
        .addSubcommand((sub) => sub
        .setName('volume')
        .setDescription('Ovoz balandligi (1–200%)')
        .addIntegerOption((opt) => opt.setName('percent').setDescription('Foiz').setMinValue(1).setMaxValue(200).setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('loop')
        .setDescription('Takrorlash rejimi')
        .addStringOption((opt) => opt
        .setName('mode')
        .setDescription('Rejim')
        .setRequired(true)
        .addChoices({ name: "O'chiq", value: 'off' }, { name: 'Joriy trek', value: 'track' }, { name: 'Butun navbat', value: 'queue' })))
        .addSubcommand((sub) => sub.setName('shuffle').setDescription('Navbatni aralashtiradi'))
        .addSubcommand((sub) => sub.setName('leave').setDescription('Ovozli kanaldan chiqadi')),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const member = interaction.member;
        const subcommand = interaction.options.getSubcommand();
        const voiceChannel = member.voice.channel;
        if (subcommand === 'play') {
            if (!voiceChannel) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('music.joinVoice')), true);
                return;
            }
            const existing = (0, player_1.findGuildPlayer)(guild.id);
            if (existing?.channelId && existing.channelId !== voiceChannel.id && existing.isPlaying) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('music.sameChannel', { channel: `<#${existing.channelId}>` })), true);
                return;
            }
            const url = (0, player_1.parseAudioUrl)(interaction.options.getString('url', true));
            if (!url) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('music.invalidUrl')), true);
                return;
            }
            await interaction.deferReply();
            if (!(await (0, player_1.looksLikeAudio)(url))) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('music.invalidUrl')));
                return;
            }
            const player = (0, player_1.getGuildPlayer)(guild.id);
            if (player.queue.length >= player_1.MAX_QUEUE) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('music.queueFull', { max: player_1.MAX_QUEUE })));
                return;
            }
            try {
                await player.connect(voiceChannel);
            }
            catch {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('music.connectFailed')));
                return;
            }
            if (interaction.channel?.isTextBased() && !interaction.channel.isDMBased())
                player.textChannel = interaction.channel;
            const title = (0, player_1.titleFromUrl)(url);
            const position = player.enqueue({
                title,
                url: url.toString(),
                requestedById: interaction.user.id,
                requestedBy: interaction.user.username,
            });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(position === 0 ? t('music.started', { title }) : t('music.queued', { title, position })));
            return;
        }
        const player = (0, player_1.findGuildPlayer)(guild.id);
        if (!player || (!player.current && player.queue.length === 0 && subcommand !== 'leave')) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('music.nothing')), true);
            return;
        }
        // Boshqaruv uchun bot bilan bir kanalda bo'lish kerak.
        const controlling = !['queue', 'nowplaying'].includes(subcommand);
        if (controlling && player.channelId && voiceChannel?.id !== player.channelId) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('music.sameChannel', { channel: `<#${player.channelId}>` })), true);
            return;
        }
        switch (subcommand) {
            case 'pause':
                player.pause();
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('music.paused')));
                return;
            case 'resume':
                player.resume();
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('music.resumed')));
                return;
            case 'skip': {
                const skipped = player.skip();
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('music.skipped', { title: skipped?.title ?? '—' })));
                return;
            }
            case 'stop':
                player.stop();
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('music.stopped')));
                return;
            case 'volume': {
                player.setVolume(interaction.options.getInteger('percent', true));
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('music.volumeSet', { volume: player.volume })));
                return;
            }
            case 'loop': {
                player.loop = interaction.options.getString('mode', true);
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('music.loopSet', { mode: t(LOOP_LABEL_KEYS[player.loop]) })));
                return;
            }
            case 'shuffle':
                player.shuffle();
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('music.shuffled', { count: player.queue.length })));
                return;
            case 'leave':
                player.destroy();
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('music.left')));
                return;
            case 'queue':
                await interaction.reply({ embeds: [queueEmbed(player, t)] });
                return;
            case 'nowplaying':
                await interaction.reply({ embeds: [nowPlayingEmbed(player, t)], flags: player.current ? undefined : discord_js_1.MessageFlags.Ephemeral });
                return;
        }
    },
});
function nowPlayingEmbed(player, t) {
    const track = player.current;
    if (!track)
        return (0, embeds_1.errorEmbed)(t('music.nothing'));
    return new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.brand)
        .setTitle(`🎵 ${t('music.nowPlaying')}`)
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields({ name: t('music.elapsed'), value: (0, player_1.formatClock)(player.elapsedMs), inline: true }, { name: t('music.requestedBy'), value: `<@${track.requestedById}>`, inline: true }, { name: t('music.volume'), value: `${player.volume}%`, inline: true }, { name: t('music.loop'), value: t(LOOP_LABEL_KEYS[player.loop]), inline: true }, { name: t('music.inQueue'), value: String(player.queue.length), inline: true });
}
function queueEmbed(player, t) {
    const lines = [];
    if (player.current)
        lines.push(`▶️ **${player.current.title}** · <@${player.current.requestedById}>`, '');
    player.queue.slice(0, 15).forEach((track, index) => {
        lines.push(`\`${index + 1}.\` ${track.title} · <@${track.requestedById}>`);
    });
    if (player.queue.length > 15)
        lines.push(t('music.more', { count: player.queue.length - 15 }));
    if (player.queue.length === 0)
        lines.push(t('music.queueEmpty'));
    return new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.brand)
        .setTitle(`🎶 ${t('music.queueTitle')}`)
        .setDescription((0, embeds_1.truncate)(lines.join('\n'), 4000))
        .setFooter({ text: `${t('music.loop')}: ${t(LOOP_LABEL_KEYS[player.loop])} · ${t('music.volume')}: ${player.volume}%` });
}
//# sourceMappingURL=music.js.map