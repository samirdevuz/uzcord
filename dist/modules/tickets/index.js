"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICKET_BUTTONS = void 0;
exports.isTicketStaff = isTicketStaff;
exports.ticketChannelName = ticketChannelName;
exports.panelComponents = panelComponents;
exports.formatTranscript = formatTranscript;
exports.closeTicket = closeTicket;
exports.handleTicketButton = handleTicketButton;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const tickets_1 = require("../../db/tickets");
const i18n_1 = require("../../i18n");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
const log = (0, logger_1.createLogger)('tickets');
exports.TICKET_BUTTONS = {
    create: 'ticket_create',
    claim: 'ticket_claim',
    close: 'ticket_close',
    confirm: 'ticket_close_confirm',
    cancel: 'ticket_close_cancel',
};
const TRANSCRIPT_LIMIT = 1000; // shuncha xabargacha saqlanadi
const DB_TRANSCRIPT_CHARS = 100_000;
function translatorFor(guildId) {
    return (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(guildId).locale);
}
/** A'zo support jamoasidanmi (support roli yoki kanallarni boshqarish ruxsati). */
function isTicketStaff(member, settings) {
    if (member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels))
        return true;
    return settings.support_role_ids.some((roleId) => member.roles.cache.has(roleId));
}
function ticketChannelName(number) {
    return `ticket-${String(number).padStart(4, '0')}`;
}
function panelComponents(t) {
    return [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(exports.TICKET_BUTTONS.create)
            .setLabel(t('ticket.panelButton'))
            .setEmoji('📩')
            .setStyle(discord_js_1.ButtonStyle.Primary)),
    ];
}
function controlComponents(t, claimed) {
    return [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(exports.TICKET_BUTTONS.claim)
            .setLabel(t('ticket.claimButton'))
            .setEmoji('🙋')
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(claimed), new discord_js_1.ButtonBuilder()
            .setCustomId(exports.TICKET_BUTTONS.close)
            .setLabel(t('ticket.closeButton'))
            .setEmoji('🔒')
            .setStyle(discord_js_1.ButtonStyle.Danger)),
    ];
}
/** Xabarlarni o'qishga qulay matnli transcriptga aylantiradi. */
function formatTranscript(header, lines) {
    const stamp = (date) => date.toISOString().replace('T', ' ').slice(0, 19);
    const body = lines.map((line) => {
        const parts = [`[${stamp(line.at)} UTC] ${line.author}: ${line.content}`.trimEnd()];
        for (const url of line.attachments)
            parts.push(`    📎 ${url}`);
        return parts.join('\n');
    });
    return [...header, '='.repeat(60), ...body, ''].join('\n');
}
async function collectMessages(channel) {
    const collected = [];
    let before;
    while (collected.length < TRANSCRIPT_LIMIT) {
        const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
        if (!batch || batch.size === 0)
            break;
        collected.push(...batch.values());
        before = batch.last()?.id;
        if (batch.size < 100)
            break;
    }
    return collected.reverse();
}
// ── Asosiy amallar ──────────────────────────────────────────────────────────
async function openTicket(interaction, t) {
    const guild = interaction.guild;
    const member = interaction.member;
    const settings = await (0, tickets_1.getTicketSettings)(guild.id);
    if (!settings.enabled) {
        await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)(t('ticket.disabled'))] });
        return;
    }
    const open = await (0, tickets_1.getOpenTicketsForUser)(guild.id, member.id);
    const stillOpen = open.filter((ticket) => guild.channels.cache.has(ticket.channel_id));
    // Kanali qo'lda o'chirilgan murojaatlarni yopiq deb belgilaymiz.
    for (const ticket of open) {
        if (!guild.channels.cache.has(ticket.channel_id)) {
            await (0, tickets_1.updateTicket)(ticket.id, { status: 'closed', closed_at: new Date().toISOString() });
        }
    }
    if (stillOpen.length >= Math.max(1, settings.max_open_per_user)) {
        await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)(t('ticket.limit', { channel: `<#${stillOpen[0].channel_id}>` }))] });
        return;
    }
    const me = guild.members.me;
    if (!me?.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels)) {
        await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)(t('ticket.createFailed'))] });
        return;
    }
    const number = await (0, tickets_1.getNextTicketNumber)(guild.id);
    const memberAllow = [
        discord_js_1.PermissionFlagsBits.ViewChannel,
        discord_js_1.PermissionFlagsBits.SendMessages,
        discord_js_1.PermissionFlagsBits.ReadMessageHistory,
        discord_js_1.PermissionFlagsBits.AttachFiles,
        discord_js_1.PermissionFlagsBits.EmbedLinks,
    ];
    const overwrites = [
        { id: guild.roles.everyone.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
        { id: member.id, allow: memberAllow },
        { id: me.id, allow: [...memberAllow, discord_js_1.PermissionFlagsBits.ManageChannels, discord_js_1.PermissionFlagsBits.ManageMessages] },
    ];
    for (const roleId of settings.support_role_ids) {
        if (guild.roles.cache.has(roleId)) {
            overwrites.push({ id: roleId, allow: [...memberAllow, discord_js_1.PermissionFlagsBits.ManageMessages] });
        }
    }
    const category = settings.category_id ? guild.channels.cache.get(settings.category_id) : undefined;
    const channel = await guild.channels
        .create({
        name: ticketChannelName(number),
        type: discord_js_1.ChannelType.GuildText,
        parent: category?.type === discord_js_1.ChannelType.GuildCategory ? category.id : undefined,
        topic: `${member.user.tag} (${member.id}) · #${number}`,
        permissionOverwrites: overwrites,
        reason: `Murojaat #${number}: ${member.user.tag}`,
    })
        .catch((error) => {
        log.warn(`Ticket kanalini yaratib bo'lmadi (${guild.id}):`, error);
        return null;
    });
    if (!channel) {
        await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)(t('ticket.createFailed'))] });
        return;
    }
    const ticket = await (0, tickets_1.createTicket)({
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
        await interaction.editReply({ embeds: [(0, embeds_1.errorEmbed)(t('error.generic'))] });
        return;
    }
    const welcome = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.info)
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
async function claimTicket(interaction, ticket, t) {
    const settings = await (0, tickets_1.getTicketSettings)(interaction.guildId);
    if (!isTicketStaff(interaction.member, settings)) {
        await interaction.reply({ embeds: [(0, embeds_1.errorEmbed)(t('ticket.staffOnly'))], flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (ticket.claimed_by) {
        await interaction.reply({
            embeds: [(0, embeds_1.errorEmbed)(t('ticket.alreadyClaimed', { user: `<@${ticket.claimed_by}>` }))],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return;
    }
    await (0, tickets_1.updateTicket)(ticket.id, { status: 'claimed', claimed_by: interaction.user.id });
    await interaction.update({ components: controlComponents(t, true) });
    await interaction.followUp({ content: t('ticket.claimed', { user: `<@${interaction.user.id}>` }) });
}
function confirmComponents(t) {
    return [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(exports.TICKET_BUTTONS.confirm).setLabel(t('ticket.closeConfirm')).setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId(exports.TICKET_BUTTONS.cancel).setLabel(t('ticket.cancel')).setStyle(discord_js_1.ButtonStyle.Secondary)),
    ];
}
/**
 * Murojaatni yopadi: transcript tuzadi, transcript kanaliga va murojaat
 * egasiga yuboradi, bazani yangilaydi va kanalni o'chiradi.
 */
async function closeTicket(guild, channel, ticket, closer, reason) {
    const t = translatorFor(guild.id);
    const settings = await (0, tickets_1.getTicketSettings)(guild.id);
    await channel.send({ content: t('ticket.closing', { user: `<@${closer.id}>` }) }).catch(() => null);
    const messages = await collectMessages(channel);
    const lines = messages
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
    await (0, tickets_1.updateTicket)(ticket.id, {
        status: 'closed',
        closed_by: closer.id,
        close_reason: reason,
        closed_at: new Date().toISOString(),
        message_count: lines.length,
        transcript: transcript.slice(0, DB_TRANSCRIPT_CHARS),
    });
    const fileName = `${ticketChannelName(ticket.ticket_number)}.txt`;
    const summary = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.neutral)
        .setTitle(t('ticket.transcriptTitle', { number: ticket.ticket_number }))
        .addFields({ name: t('ticket.opener'), value: `<@${ticket.opener_id}>`, inline: true }, { name: t('ticket.closedBy'), value: `<@${closer.id}>`, inline: true }, { name: t('ticket.claimedBy'), value: ticket.claimed_by ? `<@${ticket.claimed_by}>` : '—', inline: true }, { name: t('ticket.messages'), value: String(lines.length), inline: true }, { name: t('ticket.duration'), value: Number.isFinite(openedAt) ? (0, time_1.formatDuration)(Date.now() - openedAt) : '—', inline: true }, { name: t('ticket.reason'), value: (0, embeds_1.truncate)(reason ?? '—') })
        .setTimestamp();
    if (settings.transcript_channel_id) {
        const logChannel = await guild.channels.fetch(settings.transcript_channel_id).catch(() => null);
        if (logChannel?.isTextBased() && 'send' in logChannel) {
            await logChannel
                .send({ embeds: [summary], files: [new discord_js_1.AttachmentBuilder(Buffer.from(transcript, 'utf8'), { name: fileName })] })
                .catch((error) => log.warn('Transcriptni yuborib bo\'lmadi:', error));
        }
    }
    const opener = await guild.client.users.fetch(ticket.opener_id).catch(() => null);
    if (opener) {
        await opener
            .send({
            content: t('ticket.dmClosed', { guild: guild.name, number: ticket.ticket_number }),
            files: [new discord_js_1.AttachmentBuilder(Buffer.from(transcript, 'utf8'), { name: fileName })],
        })
            .catch(() => null); // DM yopiq bo'lishi mumkin
    }
    setTimeout(() => {
        void channel.delete(`Murojaat #${ticket.ticket_number} yopildi`).catch(() => null);
    }, 5000);
}
/** Ticket tugmalarini qayta ishlaydi. Tugma shu modulga tegishli bo'lsa `true`. */
async function handleTicketButton(interaction) {
    const id = interaction.customId;
    if (!Object.values(exports.TICKET_BUTTONS).includes(id))
        return false;
    const t = translatorFor(interaction.guildId);
    if (id === exports.TICKET_BUTTONS.create) {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        await openTicket(interaction, t);
        return true;
    }
    const ticket = await (0, tickets_1.getTicketByChannel)(interaction.channelId);
    if (!ticket || ticket.status === 'closed') {
        await interaction.reply({ embeds: [(0, embeds_1.errorEmbed)(t('ticket.notTicket'))], flags: discord_js_1.MessageFlags.Ephemeral });
        return true;
    }
    if (id === exports.TICKET_BUTTONS.claim) {
        await claimTicket(interaction, ticket, t);
        return true;
    }
    const settings = await (0, tickets_1.getTicketSettings)(interaction.guildId);
    const allowed = interaction.user.id === ticket.opener_id || isTicketStaff(interaction.member, settings);
    if (!allowed) {
        await interaction.reply({ embeds: [(0, embeds_1.errorEmbed)(t('ticket.staffOnly'))], flags: discord_js_1.MessageFlags.Ephemeral });
        return true;
    }
    if (id === exports.TICKET_BUTTONS.close) {
        await interaction.reply({ content: t('ticket.closeAsk'), components: confirmComponents(t), flags: discord_js_1.MessageFlags.Ephemeral });
        return true;
    }
    if (id === exports.TICKET_BUTTONS.cancel) {
        await interaction.update({ content: t('ticket.closeCancelled'), components: [] });
        return true;
    }
    // confirm
    await interaction.update({ content: t('ticket.closingShort'), components: [] });
    if (interaction.channel?.type === discord_js_1.ChannelType.GuildText) {
        await closeTicket(interaction.guild, interaction.channel, ticket, interaction.user, null);
    }
    return true;
}
//# sourceMappingURL=index.js.map