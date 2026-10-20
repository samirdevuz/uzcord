import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  type AudioPlayer,
  type AudioResource,
  type DiscordGatewayAdapterCreator,
  type VoiceConnection,
} from '@discordjs/voice';
import { isIP } from 'node:net';
import type { GuildTextBasedChannel, VoiceBasedChannel } from 'discord.js';
import { createLogger } from '../../core/logger';
import { getSettings } from '../../db/guilds';
import { createTranslator, type TranslationKey } from '../../i18n';

const log = createLogger('music');

export const MAX_QUEUE = 100;
const IDLE_LEAVE_MS = 3 * 60 * 1000; // navbat tugagach shuncha kutib chiqadi
const EMPTY_LEAVE_MS = 60 * 1000; // kanalda hech kim qolmasa

export type LoopMode = 'off' | 'track' | 'queue';

export interface Track {
  title: string;
  url: string;
  requestedById: string;
  requestedBy: string;
}

// ── URL tekshiruvi ──────────────────────────────────────────────────────────

/** Ichki tarmoq manzillari — ffmpeg orqali botning serveridagi xizmatlarga so'rov ketmasligi uchun. */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  const version = isIP(host);
  if (version === 4) {
    const [a, b] = host.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
    );
  }
  if (version === 6) {
    return host === '::1' || host === '::' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80');
  }
  return false;
}

/** Faqat ochiq internetdagi http(s) havolalar qabul qilinadi. */
export function parseAudioUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (isPrivateHost(url.hostname)) return null;
  return url;
}

/** Havoladan o'qishga qulay nom: fayl nomi yoki domen. */
export function titleFromUrl(url: URL): string {
  const last = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '');
  const name = last.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_+]+/g, ' ').trim();
  return (name || url.hostname).slice(0, 100);
}

/** Havola HTML sahifa emasligini tekshiradi (YouTube, Spotify va h.k. ochilmaydi). */
export async function looksLikeAudio(url: URL): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(6000) });
    const type = response.headers.get('content-type') ?? '';
    if (type.includes('text/html') || type.includes('application/json')) return false;
    return true;
  } catch {
    // Ba'zi radio oqimlari HEAD ni qo'llamaydi — ffmpeg o'zi tekshiradi.
    return true;
  }
}

// ── Pleyer ──────────────────────────────────────────────────────────────────

export class GuildMusicPlayer {
  public readonly guildId: string;
  public connection: VoiceConnection | null = null;
  public readonly player: AudioPlayer;
  public queue: Track[] = [];
  public current: Track | null = null;
  public startedAt = 0;
  public volume = 80; // foiz
  public loop: LoopMode = 'off';
  public textChannel: GuildTextBasedChannel | null = null;
  private resource: AudioResource<Track> | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private emptyTimer: NodeJS.Timeout | null = null;
  private destroyed = false;

  constructor(guildId: string) {
    this.guildId = guildId;
    this.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

    this.player.on(AudioPlayerStatus.Idle, () => this.onTrackEnd());
    this.player.on(AudioPlayerStatus.Playing, () => this.clearIdleTimer());
    this.player.on('error', (error) => {
      const track = error.resource.metadata as Track | undefined;
      log.warn(`Ijro xatosi (${this.guildId}):`, error.message);
      if (track) void this.announce(this.t('music.playError', { title: track.title }));
    });
  }

  private t(key: TranslationKey, vars?: Record<string, string | number>): string {
    return createTranslator(getSettings(this.guildId).locale)(key, vars);
  }

  get channelId(): string | null {
    return this.connection?.joinConfig.channelId ?? null;
  }

  get isPlaying(): boolean {
    return this.player.state.status === AudioPlayerStatus.Playing || this.player.state.status === AudioPlayerStatus.Paused;
  }

  get elapsedMs(): number {
    return this.resource ? this.resource.playbackDuration : 0;
  }

  /** Ovozli kanalga ulanadi va tayyor bo'lishini kutadi. */
  async connect(channel: VoiceBasedChannel): Promise<void> {
    if (this.connection && this.channelId === channel.id && this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      return;
    }
    this.connection?.destroy();

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: this.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
      selfDeaf: true,
    });
    this.connection = connection;

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        // Kanal almashtirilgan yoki qisqa uzilish — qayta ulanishni kutamiz.
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        this.destroy();
      }
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    } catch (error) {
      this.destroy();
      throw error;
    }
    connection.subscribe(this.player);
  }

  /** Trekni navbatga qo'shadi; hech narsa ijro etilmayotgan bo'lsa darhol boshlaydi. Navbatdagi o'rnini qaytaradi. */
  enqueue(track: Track): number {
    this.queue.push(track);
    if (!this.current) {
      this.playNext();
      return 0;
    }
    return this.queue.length;
  }

  private onTrackEnd(): void {
    if (this.destroyed) return;
    const finished = this.current;
    this.resource = null;
    if (finished && this.loop === 'track') {
      this.play(finished);
      return;
    }
    if (finished && this.loop === 'queue') this.queue.push(finished);
    this.playNext();
  }

  playNext(): void {
    const next = this.queue.shift();
    if (!next) {
      this.current = null;
      this.startIdleTimer();
      return;
    }
    this.play(next);
  }

  private play(track: Track): void {
    this.current = track;
    try {
      // Matnli kirish — @discordjs/voice uni ffmpeg orqali Opus'ga o'giradi.
      const resource = createAudioResource(track.url, { metadata: track, inlineVolume: true });
      resource.volume?.setVolumeLogarithmic(this.volume / 100);
      this.resource = resource;
      this.startedAt = Date.now();
      this.player.play(resource);
      void this.announce(`🎶 ${this.t('music.nowPlayingLine', { title: track.title, user: track.requestedBy })}`);
    } catch (error) {
      log.warn(`Trekni boshlab bo'lmadi (${track.url}):`, error);
      void this.announce(this.t('music.playError', { title: track.title }));
      this.playNext();
    }
  }

  skip(): Track | null {
    const skipped = this.current;
    if (this.loop === 'track') this.loop = 'off';
    this.player.stop(true); // Idle -> keyingi trek
    return skipped;
  }

  setVolume(percent: number): void {
    this.volume = Math.min(200, Math.max(1, Math.round(percent)));
    this.resource?.volume?.setVolumeLogarithmic(this.volume / 100);
  }

  pause(): boolean {
    return this.player.pause();
  }

  resume(): boolean {
    return this.player.unpause();
  }

  stop(): void {
    this.queue = [];
    this.loop = 'off';
    this.current = null;
    this.player.stop(true);
  }

  shuffle(): void {
    for (let i = this.queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  /** Kanalda faqat bot qolganda chaqiriladi. */
  scheduleEmptyLeave(): void {
    if (this.emptyTimer) return;
    this.emptyTimer = setTimeout(() => {
      this.emptyTimer = null;
      void this.announce(this.t('music.leftEmpty'));
      this.destroy();
    }, EMPTY_LEAVE_MS);
    this.emptyTimer.unref();
  }

  cancelEmptyLeave(): void {
    if (this.emptyTimer) clearTimeout(this.emptyTimer);
    this.emptyTimer = null;
  }

  private startIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      void this.announce(this.t('music.leftIdle'));
      this.destroy();
    }, IDLE_LEAVE_MS);
    this.idleTimer.unref();
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private async announce(content: string): Promise<void> {
    await this.textChannel?.send({ content, allowedMentions: { parse: [] } }).catch(() => null);
  }

  /** Hamma narsani to'xtatib, kanaldan chiqadi va pleyerni xotiradan o'chiradi. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearIdleTimer();
    this.cancelEmptyLeave();
    this.queue = [];
    this.current = null;
    this.player.stop(true);
    if (this.connection && this.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      this.connection.destroy();
    }
    this.connection = null;
    players.delete(this.guildId);
  }
}

const players = new Map<string, GuildMusicPlayer>();

export function getGuildPlayer(guildId: string): GuildMusicPlayer {
  let player = players.get(guildId);
  if (!player) {
    player = new GuildMusicPlayer(guildId);
    players.set(guildId, player);
  }
  return player;
}

export function findGuildPlayer(guildId: string): GuildMusicPlayer | undefined {
  return players.get(guildId);
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
