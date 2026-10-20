import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  type ButtonInteraction,
  type Guild,
  type GuildMember,
  type Message,
  type OverwriteResolvable,
  type TextChannel,
  type User,
} from 'discord.js';
import { createLogger } from '../../core/logger';
import { getSettings } from '../../db/guilds';
import {
  createTicket,
  getNextTicketNumber,
  getOpenTicketsForUser,
  getTicketByChannel,
  getTicketSettings,
  updateTicket,
  type Ticket,
  type TicketSettings,
} from '../../db/tickets';
import { createTranslator, type Translator } from '../../i18n';
import { COLORS, errorEmbed, truncate } from '../../utils/embeds';
import { formatDuration } from '../../utils/time';

const log = createLogger('tickets');

export const TICKET_BUTTONS = {
  create: 'ticket_create',
  claim: 'ticket_claim',
  close: 'ticket_close',
  confirm: 'ticket_close_confirm',
  cancel: 'ticket_close_cancel',
} as const;

const TRANSCRIPT_LIMIT = 1000; // shuncha xabargacha saqlanadi
const DB_TRANSCRIPT_CHARS = 100_000;

function translatorFor(guildId: string): Translator {
  return createTranslator(getSettings(guildId).locale);
}

/** A'zo support jamoasidanmi (support roli yoki kanallarni boshqarish ruxsati). */
export function isTicketStaff(member: GuildMember, settings: TicketSettings): boolean {
  if (member.permissions.has(PermissionFlagsBits.ManageChannels)) return true;
  return settings.support_role_ids.some((roleId) => member.roles.cache.has(roleId));
}

export function ticketChannelName(number: number): string {
  return `ticket-${String(number).padStart(4, '0')}`;
}

export function panelComponents(t: Translator): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(TICKET_BUTTONS.create)
        .setLabel(t('ticket.panelButton'))
        .setEmoji('📩')
        .setStyle(ButtonStyle.Primary)
    ),
  ];
}

function controlComponents(t: Translator, claimed: boolean): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(TICKET_BUTTONS.claim)
        .setLabel(t('ticket.claimButton'))
        .setEmoji('🙋')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(claimed),
      new ButtonBuilder()
        .setCustomId(TICKET_BUTTONS.close)
        .setLabel(t('ticket.closeButton'))
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

// ── Transcript ──────────────────────────────────────────────────────────────

export interface TranscriptLine {
  at: Date;
  author: string;
  content: string;
  attachments: string[];
}

/** Xabarlarni o'qishga qulay matnli transcriptga aylantiradi. */
export function formatTranscript(header: string[], lines: TranscriptLine[]): string {
  const stamp = (date: Date) => date.toISOString().replace('T', ' ').slice(0, 19);
  const body = lines.map((line) => {
    const parts = [`[${stamp(line.at)} UTC] ${line.author}: ${line.content}`.trimEnd()];
    for (const url of line.attachments) parts.push(`    📎 ${url}`);
    return parts.join('\n');
  });
  return [...header, '='.repeat(60), ...body, ''].join('\n');
}

async function collectMessages(channel: TextChannel): Promise<Message[]> {
  const collected: Message[] = [];
  let before: string | undefined;
  while (collected.length < TRANSCRIPT_LIMIT) {
    const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
    if (!batch || batch.size === 0) break;
    collected.push(...batch.values());
    before = batch.last()?.id;
    if (batch.size < 100) break;
  }
  return collected.reverse();
}

// ── Asosiy amallar ──────────────────────────────────────────────────────────

async function openTicket(interaction: ButtonInteraction<'cached'>, t: Translator): Promise<void> {
  const guild = interaction.guild;
  const member = interaction.member;
  const settings = await getTicketSettings(guild.id);

  if (!settings.enabled) {
    await interaction.editReply({ embeds: [errorEmbed(t('ticket.disabled'))] });
    return;
  }

  const open = await getOpenTicketsForUser(guild.id, member.id);
  const stillOpen = open.filter((ticket) => guild.channels.cache.has(ticket.channel_id));
  // Kanali qo'lda o'chirilgan murojaatlarni yopiq deb belgilaymiz.
  for (const ticket of open) {
    if (!guild.channels.cache.has(ticket.channel_id)) {
      await updateTicket(ticket.id, { status: 'closed', closed_at: new Date().toISOString() });
    }
  }
  if (stillOpen.length >= Math.max(1, settings.max_open_per_user)) {
    await interaction.editReply({ embeds: [errorEmbed(t('ticket.limit', { channel: `<#${stillOpen[0].channel_id}>` }))] });
    return;
  }

  const me = guild.members.me;
  if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await interaction.editReply({ embeds: [errorEmbed(t('ticket.createFailed'))] });
    return;
  }

  const number = await getNextTicketNumber(guild.id);
  const memberAllow = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.EmbedLinks,
  ];
  const overwrites: OverwriteResolvable[] = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: member.id, allow: memberAllow },
    { id: me.id, allow: [...memberAllow, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] },
  ];
  for (const roleId of settings.support_role_ids) {
    if (guild.roles.cache.has(roleId)) {
      overwrites.push({ id: roleId, allow: [...memberAllow, PermissionFlagsBits.ManageMessages] });
    }
  }

  const category = settings.category_id ? guild.channels.cache.get(settings.category_id) : undefined;
  const channel = await guild.channels
    .create({
      name: ticketChannelName(number),
      type: ChannelType.GuildText,
      parent: category?.type === ChannelType.GuildCategory ? category.id : undefined,
      topic: `${member.user.tag} (${member.id}) · #${number}`,
      permissionOverwrites: overwrites,
      reason: `Murojaat #${number}: ${member.user.tag}`,
    })
    .catch((error: unknown) => {
      log.warn(`Ticket kanalini yaratib bo'lmadi (${guild.id}):`, error);
      return null;
    });

  if (!channel) {
    await interaction.editReply({ embeds: [errorEmbed(t('ticket.createFailed'))] });
    return;
  }

  const ticket = await createTicket({
    guild_id: guild.id,
    ticket_number: number,
    channel_id: channel.id,
    opener_id: member.id,
    opener_tag: member.user.tag,
    topic: null,
    status: 'open',
  });
  if (!ticket) {
    await channel.delete('Murojaatni bazaga yozib bo\'lmadi').catch(() => null);
    await interaction.editReply({ embeds: [errorEmbed(t('error.generic'))] });
    return;
  }

  const welcome = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(t('ticket.welcomeTitle', { number }))
    .setDescription(settings.open_message.replace(/\{user\}/g, `<@${member.id}>`))
    .setFooter({ text: t('ticket.welcomeFooter') })
    .setTimestamp();

  const pings = [`<@${member.id}>`, ...settings.support_role_ids.filter((id) => guild.roles.cache.has(id)).map((id) => `<@&${id}>`)];
  await channel.send({
    content: pings.join(' '),
    embeds: [welcome],
    components: controlComponents(t, false),
    allowedMentions: { users: [member.id], roles: settings.support_role_ids },
  });

  await interaction.editReply({ content: t('ticket.created', { channel: `<#${channel.id}>` }) });
}

async function claimTicket(interaction: ButtonInteraction<'cached'>, ticket: Ticket, t: Translator): Promise<void> {
  const settings = await getTicketSettings(interaction.guildId);
  if (!isTicketStaff(interaction.member, settings)) {
    await interaction.reply({ embeds: [errorEmbed(t('ticket.staffOnly'))], flags: MessageFlags.Ephemeral });
    return;
  }
  if (ticket.claimed_by) {
    await interaction.reply({
      embeds: [errorEmbed(t('ticket.alreadyClaimed', { user: `<@${ticket.claimed_by}>` }))],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await updateTicket(ticket.id, { status: 'claimed', claimed_by: interaction.user.id });
  await interaction.update({ components: controlComponents(t, true) });
  await interaction.followUp({ content: t('ticket.claimed', { user: `<@${interaction.user.id}>` }) });
}

function confirmComponents(t: Translator): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(TICKET_BUTTONS.confirm).setLabel(t('ticket.closeConfirm')).setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(TICKET_BUTTONS.cancel).setLabel(t('ticket.cancel')).setStyle(ButtonStyle.Secondary)
    ),
  ];
}

/**
 * Murojaatni yopadi: transcript tuzadi, transcript kanaliga va murojaat
 * egasiga yuboradi, bazani yangilaydi va kanalni o'chiradi.
 */
export async function closeTicket(
  guild: Guild,
  channel: TextChannel,
  ticket: Ticket,
  closer: User,
  reason: string | null
): Promise<void> {
  const t = translatorFor(guild.id);
  const settings = await getTicketSettings(guild.id);

  await channel.send({ content: t('ticket.closing', { user: `<@${closer.id}>` }) }).catch(() => null);

  const messages = await collectMessages(channel);
  const lines: TranscriptLine[] = messages
    .filter((message) => !message.author.bot || message.content || message.embeds.length > 0)
    .map((message) => ({
      at: message.createdAt,
      author: message.author.tag,
      content: message.content || message.embeds.map((embed) => embed.description ?? embed.title ?? '').join(' '),
      attachments: [...message.attachments.values()].map((attachment) => attachment.url),
    }));

  const openedAt = new Date(ticket.created_at).getTime();
  const header = [
    `${guild.name} — ${t('ticket.welcomeTitle', { number: ticket.ticket_number })}`,
    `${t('ticket.opener')}: ${ticket.opener_tag ?? ticket.opener_id} (${ticket.opener_id})`,
    `${t('ticket.closedBy')}: ${closer.tag} (${closer.id})`,
    `${t('ticket.reason')}: ${reason ?? '—'}`,
    `${t('ticket.messages')}: ${lines.length}`,
  ];
  const transcript = formatTranscript(header, lines);

  await updateTicket(ticket.id, {
    status: 'closed',
    closed_by: closer.id,
    close_reason: reason,
    closed_at: new Date().toISOString(),
    message_count: lines.length,
    transcript: transcript.slice(0, DB_TRANSCRIPT_CHARS),
  });

  const fileName = `${ticketChannelName(ticket.ticket_number)}.txt`;
  const summary = new EmbedBuilder()
    .setColor(COLORS.neutral)
    .setTitle(t('ticket.transcriptTitle', { number: ticket.ticket_number }))
    .addFields(
      { name: t('ticket.opener'), value: `<@${ticket.opener_id}>`, inline: true },
      { name: t('ticket.closedBy'), value: `<@${closer.id}>`, inline: true },
      { name: t('ticket.claimedBy'), value: ticket.claimed_by ? `<@${ticket.claimed_by}>` : '—', inline: true },
      { name: t('ticket.messages'), value: String(lines.length), inline: true },
      { name: t('ticket.duration'), value: Number.isFinite(openedAt) ? formatDuration(Date.now() - openedAt) : '—', inline: true },
      { name: t('ticket.reason'), value: truncate(reason ?? '—') }
    )
    .setTimestamp();

  if (settings.transcript_channel_id) {
    const logChannel = await guild.channels.fetch(settings.transcript_channel_id).catch(() => null);
    if (logChannel?.isTextBased() && 'send' in logChannel) {
      await logChannel
        .send({ embeds: [summary], files: [new AttachmentBuilder(Buffer.from(transcript, 'utf8'), { name: fileName })] })
        .catch((error: unknown) => log.warn('Transcriptni yuborib bo\'lmadi:', error));
    }
  }

  const opener = await guild.client.users.fetch(ticket.opener_id).catch(() => null);
  if (opener) {
    await opener
      .send({
        content: t('ticket.dmClosed', { guild: guild.name, number: ticket.ticket_number }),
        files: [new AttachmentBuilder(Buffer.from(transcript, 'utf8'), { name: fileName })],
      })
      .catch(() => null); // DM yopiq bo'lishi mumkin
  }

  setTimeout(() => {
    void channel.delete(`Murojaat #${ticket.ticket_number} yopildi`).catch(() => null);
  }, 5000);
}

/** Ticket tugmalarini qayta ishlaydi. Tugma shu modulga tegishli bo'lsa `true`. */
export async function handleTicketButton(interaction: ButtonInteraction<'cached'>): Promise<boolean> {
  const id = interaction.customId;
  if (!Object.values(TICKET_BUTTONS).includes(id as never)) return false;
  const t = translatorFor(interaction.guildId);

  if (id === TICKET_BUTTONS.create) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await openTicket(interaction, t);
    return true;
  }

  const ticket = await getTicketByChannel(interaction.channelId);
  if (!ticket || ticket.status === 'closed') {
    await interaction.reply({ embeds: [errorEmbed(t('ticket.notTicket'))], flags: MessageFlags.Ephemeral });
    return true;
  }

  if (id === TICKET_BUTTONS.claim) {
    await claimTicket(interaction, ticket, t);
    return true;
  }

  const settings = await getTicketSettings(interaction.guildId);
  const allowed = interaction.user.id === ticket.opener_id || isTicketStaff(interaction.member, settings);
  if (!allowed) {
    await interaction.reply({ embeds: [errorEmbed(t('ticket.staffOnly'))], flags: MessageFlags.Ephemeral });
    return true;
  }

  if (id === TICKET_BUTTONS.close) {
    await interaction.reply({ content: t('ticket.closeAsk'), components: confirmComponents(t), flags: MessageFlags.Ephemeral });
    return true;
  }

  if (id === TICKET_BUTTONS.cancel) {
    await interaction.update({ content: t('ticket.closeCancelled'), components: [] });
    return true;
  }

  // confirm
  await interaction.update({ content: t('ticket.closingShort'), components: [] });
  if (interaction.channel?.type === ChannelType.GuildText) {
    await closeTicket(interaction.guild, interaction.channel, ticket, interaction.user, null);
  }
  return true;
}
