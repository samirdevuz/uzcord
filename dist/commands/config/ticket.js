"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const tickets_1 = require("../../db/tickets");
const tickets_2 = require("../../modules/tickets");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'config',
    botPermissions: [discord_js_1.PermissionFlagsBits.ManageChannels],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Murojaat (ticket) tizimi')
        .setDMPermission(false)
        .addSubcommand((sub) => sub
        .setName('panel')
        .setDescription('Murojaat panelini kanalga joylaydi')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Panel kanali').addChannelTypes(discord_js_1.ChannelType.GuildText).setRequired(true))
        .addStringOption((opt) => opt.setName('title').setDescription('Panel sarlavhasi').setMaxLength(200))
        .addStringOption((opt) => opt.setName('description').setDescription('Panel matni').setMaxLength(2000)))
        .addSubcommand((sub) => sub
        .setName('setup')
        .setDescription('Sozlamalarni yangilaydi')
        .addBooleanOption((opt) => opt.setName('enabled').setDescription('Tizim yoqilsinmi?'))
        .addChannelOption((opt) => opt.setName('category').setDescription('Murojaat kanallari ochiladigan kategoriya').addChannelTypes(discord_js_1.ChannelType.GuildCategory))
        .addRoleOption((opt) => opt.setName('support_role').setDescription("Support rolini qo'shadi yoki olib tashlaydi"))
        .addChannelOption((opt) => opt.setName('transcript_channel').setDescription('Transcriptlar yuboriladigan kanal').addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addIntegerOption((opt) => opt.setName('max_open').setDescription('Bir a\'zo uchun ochiq murojaatlar chegarasi').setMinValue(1).setMaxValue(5))
        .addStringOption((opt) => opt.setName('welcome').setDescription('Yangi murojaatdagi xabar ({user} — murojaat egasi)').setMaxLength(1500)))
        .addSubcommand((sub) => sub.setName('status').setDescription('Joriy sozlamalarni ko\'rsatadi'))
        .addSubcommand((sub) => sub
        .setName('close')
        .setDescription('Shu murojaatni yopadi')
        .addStringOption((opt) => opt.setName('reason').setDescription('Sabab').setMaxLength(500)))
        .addSubcommand((sub) => sub
        .setName('add')
        .setDescription("A'zoni shu murojaatga qo'shadi")
        .addUserOption((opt) => opt.setName('user').setDescription('Foydalanuvchi').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('remove')
        .setDescription("A'zoni shu murojaatdan chiqaradi")
        .addUserOption((opt) => opt.setName('user').setDescription('Foydalanuvchi').setRequired(true))),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const member = interaction.member;
        const subcommand = interaction.options.getSubcommand();
        const settings = await (0, tickets_1.getTicketSettings)(guild.id);
        const isAdmin = member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild);
        // Sozlash komandalari — faqat serverni boshqaruvchilar uchun.
        if (['panel', 'setup', 'status'].includes(subcommand) && !isAdmin) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.noPermission')), true);
            return;
        }
        if (subcommand === 'setup') {
            const patch = {};
            const enabled = interaction.options.getBoolean('enabled');
            const category = interaction.options.getChannel('category');
            const role = interaction.options.getRole('support_role');
            const transcript = interaction.options.getChannel('transcript_channel');
            const maxOpen = interaction.options.getInteger('max_open');
            const welcome = interaction.options.getString('welcome');
            if (enabled !== null)
                patch.enabled = enabled;
            if (category)
                patch.category_id = category.id;
            if (transcript)
                patch.transcript_channel_id = transcript.id;
            if (maxOpen !== null)
                patch.max_open_per_user = maxOpen;
            if (welcome)
                patch.open_message = welcome;
            if (role) {
                const roles = new Set(settings.support_role_ids);
                if (roles.has(role.id))
                    roles.delete(role.id);
                else
                    roles.add(role.id);
                patch.support_role_ids = [...roles];
            }
            await (0, tickets_1.updateTicketSettings)(guild.id, patch);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('ticket.setupDone')), true);
            return;
        }
        if (subcommand === 'status') {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(embeds_1.COLORS.info)
                .setTitle(`📩 ${t('ticket.statusTitle')}`)
                .addFields({ name: t('ticket.fieldEnabled'), value: settings.enabled ? '✅' : '❌', inline: true }, { name: t('ticket.fieldCategory'), value: settings.category_id ? `<#${settings.category_id}>` : '—', inline: true }, {
                name: t('ticket.fieldTranscript'),
                value: settings.transcript_channel_id ? `<#${settings.transcript_channel_id}>` : '—',
                inline: true,
            }, {
                name: t('ticket.fieldSupport'),
                value: settings.support_role_ids.length > 0 ? settings.support_role_ids.map((id) => `<@&${id}>`).join(' ') : '—',
            }, { name: t('ticket.fieldMaxOpen'), value: String(settings.max_open_per_user), inline: true }, { name: t('ticket.fieldNext'), value: `#${settings.next_number}`, inline: true });
            await interaction.reply({ embeds: [embed], flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        if (subcommand === 'panel') {
            const channel = interaction.options.getChannel('channel', true);
            const me = guild.members.me;
            if (!channel.permissionsFor(me)?.has([discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.EmbedLinks])) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.botMissingPermission', { permissions: 'SendMessages, EmbedLinks' })), true);
                return;
            }
            const title = interaction.options.getString('title') ?? settings.panel_title;
            const description = interaction.options.getString('description') ?? settings.panel_description;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(embeds_1.COLORS.info)
                .setTitle(`📩 ${title}`)
                .setDescription(description)
                .setFooter({ text: guild.name, iconURL: guild.iconURL() ?? undefined });
            const message = await channel.send({ embeds: [embed], components: (0, tickets_2.panelComponents)(t) });
            await (0, tickets_1.updateTicketSettings)(guild.id, {
                enabled: true,
                panel_channel_id: channel.id,
                panel_message_id: message.id,
                panel_title: title,
                panel_description: description,
            });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('ticket.panelCreated', { channel: `<#${channel.id}>` })), true);
            return;
        }
        // close / add / remove — faqat murojaat kanali ichida.
        const ticket = await (0, tickets_1.getTicketByChannel)(interaction.channelId);
        if (!ticket || ticket.status === 'closed' || interaction.channel?.type !== discord_js_1.ChannelType.GuildText) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('ticket.notTicket')), true);
            return;
        }
        const staff = (0, tickets_2.isTicketStaff)(member, settings);
        if (subcommand === 'close') {
            if (!staff && interaction.user.id !== ticket.opener_id) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('ticket.staffOnly')), true);
                return;
            }
            await interaction.reply({ content: t('ticket.closingShort'), flags: discord_js_1.MessageFlags.Ephemeral });
            await (0, tickets_2.closeTicket)(guild, interaction.channel, ticket, interaction.user, interaction.options.getString('reason'));
            return;
        }
        if (!staff) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('ticket.staffOnly')), true);
            return;
        }
        const user = interaction.options.getUser('user', true);
        if (subcommand === 'add') {
            await interaction.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
            });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('ticket.userAdded', { user: `<@${user.id}>` })));
            return;
        }
        if (user.id === ticket.opener_id) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('ticket.cannotRemoveOpener')), true);
            return;
        }
        await interaction.channel.permissionOverwrites.delete(user.id).catch(() => null);
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('ticket.userRemoved', { user: `<@${user.id}>` })));
    },
});
//# sourceMappingURL=ticket.js.map