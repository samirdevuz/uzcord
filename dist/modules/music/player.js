"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildMusicPlayer = void 0;
exports.getGuildPlayer = getGuildPlayer;
const voice_1 = require("@discordjs/voice");
const logger_1 = require("../../core/logger");
const log = (0, logger_1.createLogger)('music');
class GuildMusicPlayer {
    guildId;
    connection = null;
    player;
    queue = [];
    currentTrack = null;
    isLooping = false;
    constructor(guildId) {
        this.guildId = guildId;
        this.player = (0, voice_1.createAudioPlayer)();
        this.player.on(voice_1.AudioPlayerStatus.Idle, () => {
            this.playNext();
        });
        this.player.on('error', (error) => {
            log.error(`Player error in guild ${this.guildId}:`, error);
            this.playNext();
        });
    }
    join(channelId, adapterCreator) {
        this.connection = (0, voice_1.joinVoiceChannel)({
            channelId,
            guildId: this.guildId,
            adapterCreator,
        });
        this.connection.subscribe(this.player);
        return this.connection;
    }
    addTrack(track) {
        this.queue.push(track);
        if (!this.currentTrack && this.player.state.status === voice_1.AudioPlayerStatus.Idle) {
            this.playNext();
        }
    }
    playNext() {
        if (this.isLooping && this.currentTrack) {
            this.playTrack(this.currentTrack);
            return;
        }
        if (this.queue.length === 0) {
            this.currentTrack = null;
            return;
        }
        const next = this.queue.shift();
        this.playTrack(next);
    }
    playTrack(track) {
        this.currentTrack = track;
        try {
            const resource = (0, voice_1.createAudioResource)(track.url);
            this.player.play(resource);
        }
        catch (err) {
            log.error(`Failed to play track ${track.title}:`, err);
            this.playNext();
        }
    }
    pause() {
        return this.player.pause();
    }
    resume() {
        return this.player.unpause();
    }
    stop() {
        this.queue = [];
        this.currentTrack = null;
        this.player.stop();
    }
    leave() {
        this.stop();
        if (this.connection) {
            this.connection.destroy();
            this.connection = null;
        }
    }
}
exports.GuildMusicPlayer = GuildMusicPlayer;
// Global Guild Music Managers
const players = new Map();
function getGuildPlayer(guildId) {
    let p = players.get(guildId);
    if (!p) {
        p = new GuildMusicPlayer(guildId);
        players.set(guildId, p);
    }
    return p;
}
//# sourceMappingURL=player.js.map