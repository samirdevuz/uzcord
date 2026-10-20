import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  type ButtonInteraction,
  type Client,
  type Message,
} from 'discord.js';
import { createLogger } from '../../core/logger';
import { getSettings } from '../../db/guilds';
import {
  castPollVote,
  claimPollEnd,
  getPollByMessage,
  getPollVotes,
  removePollVote,
  type Poll,
  type PollOption,
  type PollVote,
} from '../../db/polls';
import { createTranslator, type Translator } from '../../i18n';
import { COLORS, errorEmbed } from '../../utils/embeds';

const log = createLogger('polls');

export const POLL_PREFIX = 'poll_vote:';
export const NUMBER_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

export interface OptionResult {
  option: PollOption;
  votes: number;
  percent: number;
}

/** Har bir variant bo'yicha ovozlar soni va foizi. */
export function tallyVotes(options: PollOption[], votes: Pick<PollVote, 'option_key' | 'user_id'>[]): {
  results: OptionResult[];
  voters: number;
} {
  const counts = new Map<string, number>();
  for (const vote of votes) counts.set(vote.option_key, (counts.get(vote.option_key) ?? 0) + 1);
  const total = votes.length;
  const results = options.map((option) => {
    const count = counts.get(option.key) ?? 0;
    return { option, votes: count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
  });
  return { results, voters: new Set(votes.map((vote) => vote.user_id)).size };
}

export function resultBar(percent: number, size = 14): string {
  const filled = Math.round((percent / 100) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}

export function buildPollEmbed(
  poll: Pick<Poll, 'question' | 'options' | 'multi' | 'ends_at' | 'created_by'>,
  votes: Pick<PollVote, 'option_key' | 'user_id'>[],
  t: Translator,
  ended: boolean
): EmbedBuilder {
  const { results, voters } = tallyVotes(poll.options, votes);
  const top = Math.max(0, ...results.map((result) => result.votes));

  const lines = results.map((result, index) => {
    const lead = ended && top > 0 && result.votes === top ? ' 🏆' : '';
    return (
      `${NUMBER_EMOJI[index]} **${result.option.label}**${lead}\n` +
      `\`${resultBar(result.percent)}\` ${result.percent}% · ${result.votes}`
    );
  });

  if (ended) {
    const leaders = results.filter((result) => top > 0 && result.votes === top);
    lines.push(
      '',
      leaders.length === 0
        ? t('poll.noVotes')
        : leaders.length > 1
          ? t('poll.tie')
          : t('poll.result', { option: leaders[0].option.label, percent: leaders[0].percent })
    );
  } else if (poll.ends_at) {
    const ts = Math.floor(new Date(poll.ends_at).getTime() / 1000);
    lines.push('', `**${t('poll.ends')}:** <t:${ts}:R>`);
  }

  const mode = poll.multi ? t('poll.modeMulti') : t('poll.modeSingle');
  return new EmbedBuilder()
    .setColor(ended ? COLORS.neutral : COLORS.indigo)
    .setTitle(`📊 ${poll.question}`)
    .setDescription(lines.join('\n\n').replace(/\n\n\n/g, '\n\n'))
    .setFooter({ text: `${t('poll.footer', { count: voters, mode })}${ended ? ` · ${t('poll.ended')}` : ''}` })
    .setTimestamp();
}

export function pollComponents(options: PollOption[], ended: boolean): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>();
  options.forEach((option, index) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${POLL_PREFIX}${option.key}`)
        .setLabel(option.label.slice(0, 70))
        .setEmoji(NUMBER_EMOJI[index])
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(ended)
    );
  });
  return [row];
}

/** Avvalgi embeddagi muallif qatorini yangi embedga ko'chiradi. */
function keepAuthor(embed: EmbedBuilder, source: Message): EmbedBuilder {
  const author = source.embeds[0]?.author;
  if (author) embed.setAuthor({ name: author.name, iconURL: author.iconURL ?? undefined });
  return embed;
}

export async function handlePollButton(interaction: ButtonInteraction<'cached'>): Promise<boolean> {
  if (!interaction.customId.startsWith(POLL_PREFIX)) return false;
  const t = createTranslator(getSettings(interaction.guildId).locale);
  const key = interaction.customId.slice(POLL_PREFIX.length);

  const poll = await getPollByMessage(interaction.message.id);
  if (!poll || poll.guild_id !== interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed(t('poll.notFound'))], flags: MessageFlags.Ephemeral });
    return true;
  }
  const option = poll.options.find((item) => item.key === key);
  if (!option) return true;
  if (poll.ended || (poll.ends_at && new Date(poll.ends_at).getTime() <= Date.now())) {
    await interaction.reply({ embeds: [errorEmbed(t('poll.closed'))], flags: MessageFlags.Ephemeral });
    return true;
  }

  const before = await getPollVotes(poll.id);
  const already = before.some((vote) => vote.user_id === interaction.user.id && vote.option_key === key);
  if (already) await removePollVote(poll.id, interaction.user.id, key);
  else await castPollVote(poll.id, interaction.user.id, key, poll.multi);

  const votes = await getPollVotes(poll.id);
  await interaction.update({ embeds: [keepAuthor(buildPollEmbed(poll, votes, t, false), interaction.message)] });
  await interaction.followUp({
    content: already ? t('poll.unvoted', { option: option.label }) : t('poll.voted', { option: option.label }),
    flags: MessageFlags.Ephemeral,
  });
  return true;
}

/** So'rovnomani yakunlaydi va xabarni yakuniy natija bilan yangilaydi. */
export async function finishPoll(client: Client, poll: Poll): Promise<void> {
  if (!(await claimPollEnd(poll.id))) return;
  const t = createTranslator(getSettings(poll.guild_id).locale);
  try {
    const channel = await client.channels.fetch(poll.channel_id).catch(() => null);
    if (!channel?.isTextBased() || !poll.message_id) return;
    const message = await channel.messages.fetch(poll.message_id).catch(() => null);
    if (!message) return;
    const votes = await getPollVotes(poll.id);
    await message.edit({ embeds: [keepAuthor(buildPollEmbed(poll, votes, t, true), message)], components: pollComponents(poll.options, true) });
  } catch (error) {
    log.warn(`So'rovnomani yakunlab bo'lmadi (#${poll.id}):`, error);
  }
}
