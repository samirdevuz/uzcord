"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const roles_1 = require("../../db/roles");
const actions_1 = require("../../modules/moderation/actions");
const panel_1 = require("../../modules/roles/panel");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
exports.default = (0, types_1.defineCommand)({
    category: 'config',
    botPermissions: [discord_js_1.PermissionFlagsBits.ManageRoles],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('buttonrole')
        .setDescription("Tugma orqali rol olish panelini boshqaradi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
        .setDMPermission(false)
        .addSubcommand((sub) => sub
        .setName('panel')
        .setDescription("Yangi bo'sh panel yaratadi")
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription('Panel joylashadigan kanal')
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addStringOption((option) => option.setName('title').setDescription('Panel sarlavhasi').setMaxLength(200))
        .addStringOption((option) => option.setName('description').setDescription('Panel matni').setMaxLength(2000)))
        .addSubcommand((sub) => sub
        .setName('add')
        .setDescription("Panelga rol tugmasini qo'shadi")
        .addStringOption((option) => option.setName('message_id').setDescription('Panel xabarining IDsi').setRequired(true))
        .addRoleOption((option) => option.setName('role').setDescription('Beriladigan rol').setRequired(true))
        .addStringOption((option) => option.setName('label').setDescription('Tugma yozuvi').setMaxLength(80))
        .addStringOption((option) => option.setName('emoji').setDescription('Tugma emojisi'))
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription("Panel turgan kanal (bo'sh = joriy kanal)")
        .addChannelTypes(discord_js_1.ChannelType.GuildText)))
        .addSubcommand((sub) => sub
        .setName('remove')
        .setDescription('Paneldan rol tugmasini olib tashlaydi')
        .addStringOption((option) => option.setName('message_id').setDescription('Panel xabarining IDsi').setRequired(true))
        .addRoleOption((option) => option.setName('role').setDescription('Rol').setRequired(true))),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const sub = interaction.options.getSubcommand();
        const me = guild.members.me;
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        if (sub === 'panel') {
            const channel = interaction.options.getChannel('channel', true);
            const title = interaction.options.getString('title') ?? 'Rol tanlang';
            const description = interaction.options.getString('description') ??
                "Quyidagi tugmalardan birini bosing. Qayta bossangiz rol olib tashlanadi.";
            const message = await channel.send({ embeds: [(0, embeds_1.brandEmbed)(title, description)] });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('roles.panelCreated', { channel: `<#${channel.id}>`, id: message.id })), true);
            return;
        }
        const messageId = interaction.options.getString('message_id', true).trim();
        const role = interaction.options.getRole('role', true);
        if (sub === 'add') {
            if (!(0, permissions_1.canManageRole)(me, role.id)) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('roles.roleTooHigh')), true);
                return;
            }
            const existing = await (0, roles_1.getPanelRoles)(messageId);
            if (existing.length >= panel_1.MAX_BUTTONS) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('roles.panelFull')), true);
                return;
            }
            // Panel xabarini topamiz: avval bazadagi yozuvdan, keyin ko'rsatilgan
            // kanaldan, oxirida joriy kanaldan.
            const channelId = existing[0]?.channel_id ??
                interaction.options.getChannel('channel')?.id ??
                interaction.channelId;
            const channel = (await guild.channels.fetch(channelId).catch(() => null));
            const message = channel ? await channel.messages.fetch(messageId).catch(() => null) : null;
            if (!message) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('roles.panelNotFound')), true);
                return;
            }
            const label = interaction.options.getString('label') ?? role.name;
            const emoji = interaction.options.getString('emoji');
            await (0, roles_1.addButtonRole)({
                guild_id: guild.id,
                channel_id: message.channelId,
                message_id: messageId,
                role_id: role.id,
                label,
                emoji: emoji ?? null,
            });
            await (0, panel_1.refreshPanel)(message, await (0, roles_1.getPanelRoles)(messageId));
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('roles.buttonAdded', { role: role.name })), true);
            return;
        }
        // remove
        const existing = await (0, roles_1.getPanelRoles)(messageId);
        if (existing.length === 0) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('roles.panelNotFound')), true);
            return;
        }
        await (0, roles_1.removeButtonRole)(messageId, role.id);
        const remaining = await (0, roles_1.getPanelRoles)(messageId);
        const channel = (await guild.channels
            .fetch(existing[0].channel_id)
            .catch(() => null));
        const message = channel ? await channel.messages.fetch(messageId).catch(() => null) : null;
        if (message) {
            await message.edit({ components: (0, panel_1.buildComponents)(remaining) });
        }
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('roles.buttonRemoved', { role: role.name })), true);
    },
});
//# sourceMappingURL=buttonrole.js.map