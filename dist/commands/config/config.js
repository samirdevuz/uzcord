"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const guilds_1 = require("../../db/guilds");
const actions_1 = require("../../modules/moderation/actions");
const welcome_1 = require("../../modules/welcome");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
const time_1 = require("../../utils/time");
const i18n_1 = require("../../i18n");
const LOG_KIND_LABELS = {
    mod: 'Moderatsiya',
    message: 'Xabarlar',
    member: "A'zolar",
    server: 'Server',
    voice: 'Ovozli kanallar',
};
exports.default = (0, types_1.defineCommand)({
    category: 'config',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('config')
        .setDescription("UzCord sozlamalarini boshqaradi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((sub) => sub.setName('view').setDescription("Joriy sozlamalarni ko'rsatadi"))
        .addSubcommand((sub) => sub
        .setName('locale')
        .setDescription("Bot tilini o'zgartiradi")
        .addStringOption((option) => option
        .setName('value')
        .setDescription('Til')
        .setRequired(true)
        .addChoices({ name: "O'zbekcha", value: 'uz' }, { name: 'Русский', value: 'ru' }, { name: 'English', value: 'en' })))
        .addSubcommand((sub) => sub
        .setName('logs')
        .setDescription("Log kanalini o'rnatadi yoki o'chiradi")
        .addStringOption((option) => option
        .setName('kind')
        .setDescription('Log turi')
        .setRequired(true)
        .addChoices({ name: 'Moderatsiya (ban, warn, ...)', value: 'mod' }, { name: "Xabarlar (o'chirish, tahrirlash)", value: 'message' }, { name: "A'zolar (kirish, chiqish, rollar)", value: 'member' }, { name: 'Server (kanal, rol)', value: 'server' }, { name: 'Ovozli kanallar', value: 'voice' }))
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription("Kanal (bo'sh qoldirilsa log o'chadi)")
        .addChannelTypes(discord_js_1.ChannelType.GuildText)))
        .addSubcommand((sub) => sub
        .setName('welcome')
        .setDescription("Xush kelibsiz xabarini sozlaydi")
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription("Kanal (bo'sh = o'chirish)")
        .addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addStringOption((option) => option.setName('message').setDescription('Xabar matni').setMaxLength(1500)))
        .addSubcommand((sub) => sub
        .setName('goodbye')
        .setDescription("Xayrlashuv xabarini sozlaydi")
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription("Kanal (bo'sh = o'chirish)")
        .addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addStringOption((option) => option.setName('message').setDescription('Xabar matni').setMaxLength(1500)))
        .addSubcommand((sub) => sub
        .setName('autorole')
        .setDescription("Yangi a'zoga avtomatik beriladigan rol")
        .addRoleOption((option) => option.setName('role').setDescription("Rol (bo'sh = o'chirish)")))
        .addSubcommand((sub) => sub
        .setName('module')
        .setDescription("Modulni yoqadi yoki o'chiradi")
        .addStringOption((option) => option
        .setName('name')
        .setDescription('Modul')
        .setRequired(true)
        .addChoices({ name: 'moderation', value: 'moderation' }, { name: 'automod', value: 'automod' }, { name: 'logging', value: 'logging' }, { name: 'welcome', value: 'welcome' }, { name: 'roles', value: 'roles' }, { name: 'leveling', value: 'leveling' }, { name: 'tickets', value: 'tickets' }, { name: 'starboard', value: 'starboard' }))
        .addBooleanOption((option) => option.setName('enabled').setDescription('Yoqilsinmi?').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('dm')
        .setDescription("Jazolangan a'zoga shaxsiy xabar yuborilsinmi")
        .addBooleanOption((option) => option.setName('enabled').setDescription('Yoqilsinmi?').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('escalation')
        .setDescription("Ogohlantirishlar soniga qarab avtomatik jazo qo'shadi")
        .addIntegerOption((option) => option
        .setName('count')
        .setDescription('Ogohlantirishlar soni')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(50))
        .addStringOption((option) => option
        .setName('action')
        .setDescription('Qo\'llaniladigan jazo')
        .setRequired(true)
        .addChoices({ name: 'timeout', value: 'timeout' }, { name: 'kick', value: 'kick' }, { name: 'ban', value: 'ban' }))
        .addStringOption((option) => option.setName('duration').setDescription('Muddat (timeout/ban uchun), masalan 1h')))
        .addSubcommand((sub) => sub
        .setName('escalation-remove')
        .setDescription("Avtomatik jazo qoidasini o'chiradi")
        .addIntegerOption((option) => option.setName('count').setDescription('Ogohlantirishlar soni').setRequired(true))),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const sub = interaction.options.getSubcommand();
        // Sozlamalar Supabase ga yoziladi — 3 soniyalik javob chegarasidan
        // oshib ketmaslik uchun darhol defer qilamiz.
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        // ── view ────────────────────────────────────────────────────────────────
        if (sub === 'view') {
            const settings = (0, guilds_1.getSettings)(guild.id);
            const embed = (0, embeds_1.brandEmbed)(t('config.title', { guild: guild.name }));
            const logLines = Object.keys(guilds_1.LOG_COLUMNS).map((kind) => {
                const value = settings[guilds_1.LOG_COLUMNS[kind]];
                return `**${LOG_KIND_LABELS[kind]}:** ${value ? `<#${value}>` : t('common.none')}`;
            });
            const moduleLines = guilds_1.MODULE_NAMES.map((name) => `**${name}:** ${(0, guilds_1.isModuleEnabled)(settings, name) ? '🟢 ' + t('common.enabled') : '🔴 ' + t('common.disabled')}`);
            const escalations = await (0, guilds_1.getEscalations)(guild.id);
            const escalationText = escalations.length === 0
                ? t('config.escalationEmpty')
                : escalations
                    .map((item) => `**${item.warn_count}** ogohlantirish → \`${item.action}\`` +
                    (item.duration_ms ? ` (${(0, time_1.formatDuration)(item.duration_ms)})` : ''))
                    .join('\n');
            embed.addFields({
                name: '🌐 Til',
                value: i18n_1.LOCALE_LABELS[(0, i18n_1.isLocale)(settings.locale) ? settings.locale : 'uz'],
                inline: true,
            }, {
                name: '📨 Jazoda shaxsiy xabar',
                value: settings.dm_on_punish ? t('common.enabled') : t('common.disabled'),
                inline: true,
            }, {
                name: '🎭 Avtomatik rol',
                value: settings.autorole_id ? `<@&${settings.autorole_id}>` : t('common.none'),
                inline: true,
            }, { name: '📋 Log kanallari', value: logLines.join('\n') }, {
                name: '👋 Xush kelibsiz',
                value: settings.welcome_channel_id
                    ? `<#${settings.welcome_channel_id}>\n${(0, embeds_1.truncate)(settings.welcome_message ?? welcome_1.DEFAULT_WELCOME, 200)}`
                    : t('common.none'),
            }, {
                name: '🚪 Xayrlashuv',
                value: settings.goodbye_channel_id
                    ? `<#${settings.goodbye_channel_id}>\n${(0, embeds_1.truncate)(settings.goodbye_message ?? welcome_1.DEFAULT_GOODBYE, 200)}`
                    : t('common.none'),
            }, { name: '🧩 Modullar', value: moduleLines.join('\n') }, { name: '📈 Avtomatik jazolar', value: escalationText });
            await (0, actions_1.reply)(interaction, embed, true);
            return;
        }
        // ── locale ──────────────────────────────────────────────────────────────
        if (sub === 'locale') {
            const value = interaction.options.getString('value', true);
            await (0, guilds_1.updateSettings)(guild.id, { locale: value });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('config.localeSet', {
                locale: i18n_1.LOCALE_LABELS[(0, i18n_1.isLocale)(value) ? value : 'uz'],
            })), true);
            return;
        }
        // ── logs ────────────────────────────────────────────────────────────────
        if (sub === 'logs') {
            const kind = interaction.options.getString('kind', true);
            const channel = interaction.options.getChannel('channel');
            await (0, guilds_1.setLogChannel)(guild.id, kind, channel?.id ?? null);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(channel
                ? t('config.logSet', { kind: LOG_KIND_LABELS[kind], channel: `<#${channel.id}>` })
                : t('config.logCleared', { kind: LOG_KIND_LABELS[kind] })), true);
            return;
        }
        // ── welcome / goodbye ───────────────────────────────────────────────────
        if (sub === 'welcome' || sub === 'goodbye') {
            const channel = interaction.options.getChannel('channel');
            const message = interaction.options.getString('message');
            const isWelcome = sub === 'welcome';
            const patch = isWelcome
                ? { welcome_channel_id: channel?.id ?? null }
                : { goodbye_channel_id: channel?.id ?? null };
            if (message) {
                if (isWelcome)
                    patch.welcome_message = message;
                else
                    patch.goodbye_message = message;
            }
            await (0, guilds_1.updateSettings)(guild.id, patch);
            if (!channel) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t(isWelcome ? 'config.welcomeCleared' : 'config.goodbyeCleared')), true);
                return;
            }
            const embed = (0, embeds_1.successEmbed)(t(isWelcome ? 'config.welcomeSet' : 'config.goodbyeSet', {
                channel: `<#${channel.id}>`,
            })).setFooter({ text: t('config.placeholders') });
            await (0, actions_1.reply)(interaction, embed, true);
            return;
        }
        // ── autorole ────────────────────────────────────────────────────────────
        if (sub === 'autorole') {
            const role = interaction.options.getRole('role');
            if (!role) {
                await (0, guilds_1.updateSettings)(guild.id, { autorole_id: null });
                await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('config.autoroleCleared')), true);
                return;
            }
            const me = guild.members.me;
            if (!(0, permissions_1.canManageRole)(me, role.id)) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('roles.roleTooHigh')), true);
                return;
            }
            await (0, guilds_1.updateSettings)(guild.id, { autorole_id: role.id });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('config.autoroleSet', { role: role.name })), true);
            return;
        }
        // ── module ──────────────────────────────────────────────────────────────
        if (sub === 'module') {
            const name = interaction.options.getString('name', true);
            const enabled = interaction.options.getBoolean('enabled', true);
            await (0, guilds_1.setModule)(guild.id, name, enabled);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('config.moduleSet', {
                module: name,
                state: enabled ? t('common.enabled') : t('common.disabled'),
            })), true);
            return;
        }
        // ── dm ──────────────────────────────────────────────────────────────────
        if (sub === 'dm') {
            const enabled = interaction.options.getBoolean('enabled', true);
            await (0, guilds_1.updateSettings)(guild.id, { dm_on_punish: enabled });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('config.dmSet', { state: enabled ? t('common.enabled') : t('common.disabled') })), true);
            return;
        }
        // ── escalation ──────────────────────────────────────────────────────────
        if (sub === 'escalation') {
            const count = interaction.options.getInteger('count', true);
            const action = interaction.options.getString('action', true);
            const durationRaw = interaction.options.getString('duration');
            let durationMs = null;
            if (durationRaw) {
                durationMs = (0, time_1.parseDuration)(durationRaw);
                if (durationMs === null) {
                    await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.invalidDuration')), true);
                    return;
                }
            }
            if (action === 'timeout' && durationMs === null)
                durationMs = 60 * 60 * 1000;
            await (0, guilds_1.setEscalation)(guild.id, count, action, durationMs);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('config.escalationSet', { count, action })), true);
            return;
        }
        if (sub === 'escalation-remove') {
            const count = interaction.options.getInteger('count', true);
            const removed = await (0, guilds_1.removeEscalation)(guild.id, count);
            await (0, actions_1.reply)(interaction, removed
                ? (0, embeds_1.successEmbed)(t('config.escalationRemoved', { count }))
                : (0, embeds_1.errorEmbed)(t('config.escalationEmpty')), true);
        }
    },
});
//# sourceMappingURL=config.js.map