"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildMusicPlayer = exports.MAX_QUEUE = void 0;
exports.parseAudioUrl = parseAudioUrl;
exports.titleFromUrl = titleFromUrl;
exports.looksLikeAudio = looksLikeAudio;
exports.getGuildPlayer = getGuildPlayer;
exports.findGuildPlayer = findGuildPlayer;
exports.formatClock = formatClock;
const voice_1 = require("@discordjs/voice");
const node_net_1 = require("node:net");
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const i18n_1 = require("../../i18n");
const log = (0, logger_1.createLogger)('music');
exports.MAX_QUEUE = 100;
const IDLE_LEAVE_MS = 3 * 60 * 1000; // navbat tugagach shuncha kutib chiqadi
const EMPTY_LEAVE_MS = 60 * 1000; // kanalda hech kim qolmasa
// ── URL tekshiruvi ──────────────────────────────────────────────────────────
/** Ichki tarmoq manzillari — ffmpeg orqali botning serveridagi xizmatlarga so'rov ketmasligi uchun. */
function isPrivateHost(hostname) {
    const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
        return true;
    }
    const version = (0, node_net_1.isIP)(host);
    if (version === 4) {
        const [a, b] = host.split('.').map(Number);
        return (a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
            (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168));
    }
    if (version === 6) {
        return host === '::1' || host === '::' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80');
    }
    return false;
}
/** Faqat ochiq internetdagi http(s) havolalar qabul qilinadi. */
function parseAudioUrl(input) {
    let url;
    try {
        url = new URL(input.trim());
    }
    catch {
        return null;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
        return null;
    if (url.username || url.password)
        return null;
    if (isPrivateHost(url.hostname))
        return null;
    return url;
}
/** Havoladan o'qishga qulay nom: fayl nomi yoki domen. */
function titleFromUrl(url) {
    const last = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '');
    const name = last.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_+]+/g, ' ').trim();
    return (name || url.hostname).slice(0, 100);
}
/** Havola HTML sahifa emasligini tekshiradi (YouTube, Spotify va h.k. ochilmaydi). */
async function looksLikeAudio(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(6000) });
        const type = response.headers.get('content-type') ?? '';
        if (type.includes('text/html') || type.includes('application/json'))
            return false;
        return true;
    }
    catch {
        // Ba'zi radio oqimlari HEAD ni qo'llamaydi — ffmpeg o'zi tekshiradi.
        return true;
    }
}
// ── Pleyer ──────────────────────────────────────────────────────────────────
class GuildMusicPlayer {
    guildId;
    connection = null;
    player;
    queue = [];
    current = null;
    startedAt = 0;
    volume = 80; // foiz
    loop = 'off';
    textChannel = null;
    resource = null;
    idleTimer = null;
    emptyTimer = null;
    destroyed = false;
    constructor(guildId) {
        this.guildId = guildId;
        this.player = (0, voice_1.createAudioPlayer)({ behaviors: { noSubscriber: voice_1.NoSubscriberBehavior.Pause } });
        this.player.on(voice_1.AudioPlayerStatus.Idle, () => this.onTrackEnd());
        this.player.on(voice_1.AudioPlayerStatus.Playing, () => this.clearIdleTimer());
        this.player.on('error', (error) => {
            const track = error.resource.metadata;
            log.warn(`Ijro xatosi (${this.guildId}):`, error.message);
            if (track)
                void this.announce(this.t('music.playError', { title: track.title }));
        });
    }
    t(key, vars) {
        return (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(this.guildId).locale)(key, vars);
    }
    get channelId() {
        return this.connection?.joinConfig.channelId ?? null;
    }
    get isPlaying() {
        return this.player.state.status === voice_1.AudioPlayerStatus.Playing || this.player.state.status === voice_1.AudioPlayerStatus.Paused;
    }
    get elapsedMs() {
        return this.resource ? this.resource.playbackDuration : 0;
    }
    /** Ovozli kanalga ulanadi va tayyor bo'lishini kutadi. */
    async connect(channel) {
        if (this.connection && this.channelId === channel.id && this.connection.state.status !== voice_1.VoiceConnectionStatus.Destroyed) {
            return;
        }
        this.connection?.destroy();
        const connection = (0, voice_1.joinVoiceChannel)({
            channelId: channel.id,
            guildId: this.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: true,
        });
        this.connection = connection;
        connection.on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
            try {
                // Kanal almashtirilgan yoki qisqa uzilish — qayta ulanishni kutamiz.
                await Promise.race([
                    (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Signalling, 5000),
                    (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Connecting, 5000),
                ]);
            }
            catch {
                this.destroy();
            }
        });
        try {
            await (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 20_000);
        }
        catch (error) {
            this.destroy();
            throw error;
        }
        connection.subscribe(this.player);
    }
    /** Trekni navbatga qo'shadi; hech narsa ijro etilmayotgan bo'lsa darhol boshlaydi. Navbatdagi o'rnini qaytaradi. */
    enqueue(track) {
        this.queue.push(track);
        if (!this.current) {
            this.playNext();
            return 0;
        }
        return this.queue.length;
    }
    onTrackEnd() {
        if (this.destroyed)
            return;
        const finished = this.current;
        this.resource = null;
        if (finished && this.loop === 'track') {
            this.play(finished);
            return;
        }
        if (finished && this.loop === 'queue')
            this.queue.push(finished);
        this.playNext();
    }
    playNext() {
        const next = this.queue.shift();
        if (!next) {
            this.current = null;
            this.startIdleTimer();
            return;
        }
        this.play(next);
    }
    play(track) {
        this.current = track;
        try {
            // Matnli kirish — @discordjs/voice uni ffmpeg orqali Opus'ga o'giradi.
            const resource = (0, voice_1.createAudioResource)(track.url, { metadata: track, inlineVolume: true });
            resource.volume?.setVolumeLogarithmic(this.volume / 100);
            this.resource = resource;
            this.startedAt = Date.now();
            this.player.play(resource);
            void this.announce(`🎶 ${this.t('music.nowPlayingLine', { title: track.title, user: track.requestedBy })}`);
        }
        catch (error) {
            log.warn(`Trekni boshlab bo'lmadi (${track.url}):`, error);
            void this.announce(this.t('music.playError', { title: track.title }));
            this.playNext();
        }
    }
    skip() {
        const skipped = this.current;
        if (this.loop === 'track')
            this.loop = 'off';
        this.player.stop(true); // Idle -> keyingi trek
        return skipped;
    }
    setVolume(percent) {
        this.volume = Math.min(200, Math.max(1, Math.round(percent)));
        this.resource?.volume?.setVolumeLogarithmic(this.volume / 100);
    }
    pause() {
        return this.player.pause();
    }
    resume() {
        return this.player.unpause();
    }
    stop() {
        this.queue = [];
        this.loop = 'off';
        this.current = null;
        this.player.stop(true);
    }
    shuffle() {
        for (let i = this.queue.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
    }
    /** Kanalda faqat bot qolganda chaqiriladi. */
    scheduleEmptyLeave() {
        if (this.emptyTimer)
            return;
        this.emptyTimer = setTimeout(() => {
            this.emptyTimer = null;
            void this.announce(this.t('music.leftEmpty'));
            this.destroy();
        }, EMPTY_LEAVE_MS);
        this.emptyTimer.unref();
    }
    cancelEmptyLeave() {
        if (this.emptyTimer)
            clearTimeout(this.emptyTimer);
        this.emptyTimer = null;
    }
    startIdleTimer() {
        this.clearIdleTimer();
        this.idleTimer = setTimeout(() => {
            void this.announce(this.t('music.leftIdle'));
            this.destroy();
        }, IDLE_LEAVE_MS);
        this.idleTimer.unref();
    }
    clearIdleTimer() {
        if (this.idleTimer)
            clearTimeout(this.idleTimer);
        this.idleTimer = null;
    }
    async announce(content) {
        await this.textChannel?.send({ content, allowedMentions: { parse: [] } }).catch(() => null);
    }
    /** Hamma narsani to'xtatib, kanaldan chiqadi va pleyerni xotiradan o'chiradi. */
    destroy() {
        if (this.destroyed)
            return;
        this.destroyed = true;
        this.clearIdleTimer();
        this.cancelEmptyLeave();
        this.queue = [];
        this.current = null;
        this.player.stop(true);
        if (this.connection && this.connection.state.status !== voice_1.VoiceConnectionStatus.Destroyed) {
            this.connection.destroy();
        }
        this.connection = null;
        players.delete(this.guildId);
    }
}
exports.GuildMusicPlayer = GuildMusicPlayer;
const players = new Map();
function getGuildPlayer(guildId) {
    let player = players.get(guildId);
    if (!player) {
        player = new GuildMusicPlayer(guildId);
        players.set(guildId, player);
    }
    return player;
}
function findGuildPlayer(guildId) {
    return players.get(guildId);
}
function formatClock(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
    return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
//# sourceMappingURL=player.js.map