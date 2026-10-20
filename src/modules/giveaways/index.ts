import { randomInt } from 'node:crypto';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  type ButtonInteraction,
  type Client,
} from 'discord.js';
import { createLogger } from '../../core/logger';
import { getSettings } from '../../db/guilds';
import {
  addGiveawayEntry,
  claimGiveawayEnd,
  countGiveawayEntries,
  getGiveawayByMessage,
  getGiveawayEntries,
  removeGiveawayEntry,
  setGiveawayWinners,
  type Giveaway,
} from '../../db/giveaways';
import { createTranslator, type Translator } from '../../i18n';
import { COLORS, errorEmbed } from '../../utils/embeds';

const log = createLogger('giveaways');

export const GIVEAWAY_BUTTON = 'giveaway_enter';

/** Kriptografik tasodifiy g'oliblar (takrorlanmaydi, `exclude` dagilar tushmaydi). */
export function pickWinners(entries: string[], count: number, exclude: string[] = []): string[] {
  const pool = [...new Set(entries)].filter((id) => !exclude.includes(id));
  const winners: string[] = [];
  while (winners.length < count && pool.length > 0) {
    winners.push(pool.splice(randomInt(pool.length), 1)[0]);
  }
  return winners;
}

function unix(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

export function buildGiveawayEmbed(
  giveaway: Giveaway,
  t: Translator,
  state: { entries: number; ended: boolean; winners?: string[] }
): EmbedBuilder {
  const lines: string[] = [];
  if (giveaway.description) lines.push(giveaway.description, '');
  lines.push(`**${t('giveaway.host')}:** <@${giveaway.host_id}>`);
  lines.push(`**${t('giveaway.winners')}:** ${giveaway.winner_count}`);
  if (giveaway.required_role_id) lines.push(`**${t('giveaway.requiredRole')}:** <@&${giveaway.required_role_id}>`);
  lines.push(`**${t('giveaway.entries')}:** ${state.entries}`);

  if (state.ended) {
    const winners = state.winners ?? [];
    lines.push(
      '',
      `**${t('giveaway.winners')}:** ${winners.length > 0 ? winners.map((id) => `<@${id}>`).join(', ') : t('giveaway.noEntries')}`,
      `**${t('giveaway.endedAt')}:** <t:${Math.floor(Date.now() / 1000)}:R>`
    );
  } else {
    lines.push(`**${t('giveaway.ends')}:** <t:${unix(giveaway.ends_at)}:R> (<t:${unix(giveaway.ends_at)}:f>)`);
  }

  return new EmbedBuilder()
    .setColor(state.ended ? COLORS.neutral : COLORS.pink)
    .setTitle(`🎉 ${giveaway.prize}`)
    .setDescription(lines.join('\n'))
    .setFooter({ text: state.ended ? t('giveaway.footerEnded') : t('giveaway.footerActive') })
    .setTimestamp(new Date(giveaway.ends_at));
}

export function giveawayComponents(t: Translator, entries: number, ended: boolean): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(GIVEAWAY_BUTTON)
        .setLabel(`${t('giveaway.enterButton')} (${entries})`)
        .setEmoji('🎉')
        .setStyle(ended ? ButtonStyle.Secondary : ButtonStyle.Success)
        .setDisabled(ended)
    ),
  ];
}

export async function handleGiveawayButton(interaction: ButtonInteraction<'cached'>): Promise<boolean> {
  if (interaction.customId !== GIVEAWAY_BUTTON) return false;
  const t = createTranslator(getSettings(interaction.guildId).locale);

  const giveaway = await getGiveawayByMessage(interaction.message.id);
  if (!giveaway || giveaway.guild_id !== interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed(t('giveaway.notFound'))], flags: MessageFlags.Ephemeral });
    return true;
  }
  if (giveaway.ended || new Date(giveaway.ends_at).getTime() <= Date.now()) {
    await interaction.reply({ embeds: [errorEmbed(t('giveaway.ended'))], flags: MessageFlags.Ephemeral });
    return true;
  }
  if (giveaway.required_role_id && !interaction.member.roles.cache.has(giveaway.required_role_id)) {
    await interaction.reply({
      embeds: [errorEmbed(t('giveaway.missingRole', { role: `<@&${giveaway.required_role_id}>` }))],
      flags: MessageFlags.Ephemeral,
    });
    return true;
  }

  // Ikkinchi bosish — qatnashishdan chiqish.
  const joined = await addGiveawayEntry(giveaway.id, interaction.user.id);
  if (!joined) await removeGiveawayEntry(giveaway.id, interaction.user.id);

  const entries = await countGiveawayEntries(giveaway.id);
  await interaction.update({ components: giveawayComponents(t, entries, false) });
  await interaction.followUp({
    content: joined ? t('giveaway.entered') : t('giveaway.left'),
    flags: MessageFlags.Ephemeral,
  });
  return true;
}

/**
 * Konkursni yakunlaydi: g'oliblarni tanlaydi, xabarni yangilaydi va e'lon qiladi.
 * Scheduler va /giveaway end ikkalasi ham shuni chaqiradi; bazadagi atomik
 * belgi tufayli bir konkurs ikki marta yakunlanmaydi.
 */
export async function finishGiveaway(client: Client, giveaway: Giveaway): Promise<string[] | null> {
  if (!(await claimGiveawayEnd(giveaway.id))) return null;

  const t = createTranslator(getSettings(giveaway.guild_id).locale);
  const entries = await getGiveawayEntries(giveaway.id);
  const winners = pickWinners(entries, giveaway.winner_count);
  await setGiveawayWinners(giveaway.id, winners);

  try {
    const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
    if (!channel?.isTextBased() || !('send' in channel)) return winners;

    const message = giveaway.message_id ? await channel.messages.fetch(giveaway.message_id).catch(() => null) : null;
    if (message) {
      await message.edit({
        embeds: [buildGiveawayEmbed(giveaway, t, { entries: entries.length, ended: true, winners })],
        components: giveawayComponents(t, entries.length, true),
      });
    }

    const text =
      winners.length > 0
        ? t('giveaway.winnerAnnounce', { winners: winners.map((id) => `<@${id}>`).join(', '), prize: giveaway.prize })
        : t('giveaway.noWinners', { prize: giveaway.prize });
    await channel.send({
      content: text,
      reply: message ? { messageReference: message.id, failIfNotExists: false } : undefined,
      allowedMentions: { users: winners },
    });
  } catch (error) {
    log.warn(`Konkurs natijasini e'lon qilib bo'lmadi (#${giveaway.id}):`, error);
  }

  return winners;
}

/** Avvalgi g'oliblarni chiqarib tashlab, yangilarini tanlaydi. */
export async function rerollGiveaway(giveaway: Giveaway, count: number): Promise<string[]> {
  const entries = await getGiveawayEntries(giveaway.id);
  const fresh = pickWinners(entries, count, giveaway.winners ?? []);
  if (fresh.length > 0) await setGiveawayWinners(giveaway.id, [...(giveaway.winners ?? []), ...fresh]);
  return fresh;
}
