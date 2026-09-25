import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  VoiceConnection,
} from '@discordjs/voice';
import { createLogger } from '../../core/logger';

const log = createLogger('music');

export interface Track {
  title: string;
  url: string;
  durationStr: string;
  requestedBy: string;
}

export class GuildMusicPlayer {
  public readonly guildId: string;
  public connection: VoiceConnection | null = null;
  public readonly player: AudioPlayer;
  public queue: Track[] = [];
  public currentTrack: Track | null = null;
  public isLooping = false;

  constructor(guildId: string) {
    this.guildId = guildId;
    this.player = createAudioPlayer();

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playNext();
    });

    this.player.on('error', (error) => {
      log.error(`Player error in guild ${this.guildId}:`, error);
      this.playNext();
    });
  }

  public join(channelId: string, adapterCreator: any): VoiceConnection {
    this.connection = joinVoiceChannel({
      channelId,
      guildId: this.guildId,
      adapterCreator,
    });

    this.connection.subscribe(this.player);
    return this.connection;
  }

  public addTrack(track: Track): void {
    this.queue.push(track);
    if (!this.currentTrack && this.player.state.status === AudioPlayerStatus.Idle) {
      this.playNext();
    }
  }

  public playNext(): void {
    if (this.isLooping && this.currentTrack) {
      this.playTrack(this.currentTrack);
      return;
    }

    if (this.queue.length === 0) {
      this.currentTrack = null;
      return;
    }

    const next = this.queue.shift()!;
    this.playTrack(next);
  }

  private playTrack(track: Track): void {
    this.currentTrack = track;
    try {
      const resource = createAudioResource(track.url);
      this.player.play(resource);
    } catch (err) {
      log.error(`Failed to play track ${track.title}:`, err);
      this.playNext();
    }
  }

  public pause(): boolean {
    return this.player.pause();
  }

  public resume(): boolean {
    return this.player.unpause();
  }

  public stop(): void {
    this.queue = [];
    this.currentTrack = null;
    this.player.stop();
  }

  public leave(): void {
    this.stop();
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }
}

// Global Guild Music Managers
const players = new Map<string, GuildMusicPlayer>();

export function getGuildPlayer(guildId: string): GuildMusicPlayer {
  let p = players.get(guildId);
  if (!p) {
    p = new GuildMusicPlayer(guildId);
    players.set(guildId, p);
  }
  return p;
}
