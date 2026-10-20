import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from 'discord.js';
import { defineCommand } from '../../core/types';
import {
  MAX_QUEUE,
  findGuildPlayer,
  formatClock,
  getGuildPlayer,
  looksLikeAudio,
  parseAudioUrl,
  titleFromUrl,
  type GuildMusicPlayer,
  type LoopMode,
} from '../../modules/music/player';
import { reply } from '../../modules/moderation/actions';
import { COLORS, errorEmbed, successEmbed, truncate } from '../../utils/embeds';
import type { Translator } from '../../i18n';

const LOOP_LABEL_KEYS = { off: 'music.loopOff', track: 'music.loopTrack', queue: 'music.loopQueue' } as const;

export default defineCommand({
  category: 'utility',
  cooldown: 2,
  botPermissions: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Musiqa pleyeri: audio havolalar va internet-radio')
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('play')
        .setDescription("Audio havola yoki radio oqimini ijro etadi / navbatga qo'shadi")
        .addStringOption((opt) =>
          opt.setName('url').setDescription('To\'g\'ridan-to\'g\'ri audio havola (mp3, ogg, m4a...) yoki radio oqimi').setRequired(true)
        )
    )
    .addSubcommand((sub) => sub.setName('pause').setDescription("Ijroni vaqtincha to'xtatadi"))
    .addSubcommand((sub) => sub.setName('resume').setDescription('Ijroni davom ettiradi'))
    .addSubcommand((sub) => sub.setName('skip').setDescription("Keyingi trekka o'tadi"))
    .addSubcommand((sub) => sub.setName('stop').setDescription("Ijroni to'xtatadi va navbatni tozalaydi"))
    .addSubcommand((sub) => sub.setName('queue').setDescription('Navbatni ko\'rsatadi'))
    .addSubcommand((sub) => sub.setName('nowplaying').setDescription('Hozir ijro etilayotgan trek'))
    .addSubcommand((sub) =>
      sub
        .setName('volume')
        .setDescription('Ovoz balandligi (1–200%)')
        .addIntegerOption((opt) => opt.setName('percent').setDescription('Foiz').setMinValue(1).setMaxValue(200).setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('loop')
        .setDescription('Takrorlash rejimi')
        .addStringOption((opt) =>
          opt
            .setName('mode')
            .setDescription('Rejim')
            .setRequired(true)
            .addChoices(
              { name: "O'chiq", value: 'off' },
              { name: 'Joriy trek', value: 'track' },
              { name: 'Butun navbat', value: 'queue' }
            )
        )
    )
    .addSubcommand((sub) => sub.setName('shuffle').setDescription('Navbatni aralashtiradi'))
    .addSubcommand((sub) => sub.setName('leave').setDescription('Ovozli kanaldan chiqadi')),

  async execute(interaction: ChatInputCommandInteraction, ctx) {
    const { t } = ctx;
    const guild = interaction.guild!;
    const member = interaction.member as GuildMember;
    const subcommand = interaction.options.getSubcommand();
    const voiceChannel = member.voice.channel;

    if (subcommand === 'play') {
      if (!voiceChannel) {
        await reply(interaction, errorEmbed(t('music.joinVoice')), true);
        return;
      }
      const existing = findGuildPlayer(guild.id);
      if (existing?.channelId && existing.channelId !== voiceChannel.id && existing.isPlaying) {
        await reply(interaction, errorEmbed(t('music.sameChannel', { channel: `<#${existing.channelId}>` })), true);
        return;
      }

      const url = parseAudioUrl(interaction.options.getString('url', true));
      if (!url) {
        await reply(interaction, errorEmbed(t('music.invalidUrl')), true);
        return;
      }

      await interaction.deferReply();
      if (!(await looksLikeAudio(url))) {
        await reply(interaction, errorEmbed(t('music.invalidUrl')));
        return;
      }

      const player = getGuildPlayer(guild.id);
      if (player.queue.length >= MAX_QUEUE) {
        await reply(interaction, errorEmbed(t('music.queueFull', { max: MAX_QUEUE })));
        return;
      }

      try {
        await player.connect(voiceChannel);
      } catch {
        await reply(interaction, errorEmbed(t('music.connectFailed')));
        return;
      }
      if (interaction.channel?.isTextBased() && !interaction.channel.isDMBased()) player.textChannel = interaction.channel;

      const title = titleFromUrl(url);
      const position = player.enqueue({
        title,
        url: url.toString(),
        requestedById: interaction.user.id,
        requestedBy: interaction.user.username,
      });

      await reply(
        interaction,
        successEmbed(
          position === 0 ? t('music.started', { title }) : t('music.queued', { title, position })
        )
      );
      return;
    }

    const player = findGuildPlayer(guild.id);
    if (!player || (!player.current && player.queue.length === 0 && subcommand !== 'leave')) {
      await reply(interaction, errorEmbed(t('music.nothing')), true);
      return;
    }

    // Boshqaruv uchun bot bilan bir kanalda bo'lish kerak.
    const controlling = !['queue', 'nowplaying'].includes(subcommand);
    if (controlling && player.channelId && voiceChannel?.id !== player.channelId) {
      await reply(interaction, errorEmbed(t('music.sameChannel', { channel: `<#${player.channelId}>` })), true);
      return;
    }

    switch (subcommand) {
      case 'pause':
        player.pause();
        await reply(interaction, successEmbed(t('music.paused')));
        return;
      case 'resume':
        player.resume();
        await reply(interaction, successEmbed(t('music.resumed')));
        return;
      case 'skip': {
        const skipped = player.skip();
        await reply(interaction, successEmbed(t('music.skipped', { title: skipped?.title ?? '—' })));
        return;
      }
      case 'stop':
        player.stop();
        await reply(interaction, successEmbed(t('music.stopped')));
        return;
      case 'volume': {
        player.setVolume(interaction.options.getInteger('percent', true));
        await reply(interaction, successEmbed(t('music.volumeSet', { volume: player.volume })));
        return;
      }
      case 'loop': {
        player.loop = interaction.options.getString('mode', true) as LoopMode;
        await reply(interaction, successEmbed(t('music.loopSet', { mode: t(LOOP_LABEL_KEYS[player.loop]) })));
        return;
      }
      case 'shuffle':
        player.shuffle();
        await reply(interaction, successEmbed(t('music.shuffled', { count: player.queue.length })));
        return;
      case 'leave':
        player.destroy();
        await reply(interaction, successEmbed(t('music.left')));
        return;
      case 'queue':
        await interaction.reply({ embeds: [queueEmbed(player, t)] });
        return;
      case 'nowplaying':
        await interaction.reply({ embeds: [nowPlayingEmbed(player, t)], flags: player.current ? undefined : MessageFlags.Ephemeral });
        return;
    }
  },
});

function nowPlayingEmbed(player: GuildMusicPlayer, t: Translator): EmbedBuilder {
  const track = player.current;
  if (!track) return errorEmbed(t('music.nothing'));
  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle(`🎵 ${t('music.nowPlaying')}`)
    .setDescription(`**[${track.title}](${track.url})**`)
    .addFields(
      { name: t('music.elapsed'), value: formatClock(player.elapsedMs), inline: true },
      { name: t('music.requestedBy'), value: `<@${track.requestedById}>`, inline: true },
      { name: t('music.volume'), value: `${player.volume}%`, inline: true },
      { name: t('music.loop'), value: t(LOOP_LABEL_KEYS[player.loop]), inline: true },
      { name: t('music.inQueue'), value: String(player.queue.length), inline: true }
    );
}

function queueEmbed(player: GuildMusicPlayer, t: Translator): EmbedBuilder {
  const lines: string[] = [];
  if (player.current) lines.push(`▶️ **${player.current.title}** · <@${player.current.requestedById}>`, '');
  player.queue.slice(0, 15).forEach((track, index) => {
    lines.push(`\`${index + 1}.\` ${track.title} · <@${track.requestedById}>`);
  });
  if (player.queue.length > 15) lines.push(t('music.more', { count: player.queue.length - 15 }));
  if (player.queue.length === 0) lines.push(t('music.queueEmpty'));

  return new EmbedBuilder()
    .setColor(COLORS.brand)
    .setTitle(`🎶 ${t('music.queueTitle')}`)
    .setDescription(truncate(lines.join('\n'), 4000))
    .setFooter({ text: `${t('music.loop')}: ${t(LOOP_LABEL_KEYS[player.loop])} · ${t('music.volume')}: ${player.volume}%` });
}
