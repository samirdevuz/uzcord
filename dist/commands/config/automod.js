"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const automod_1 = require("../../db/automod");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
const FEATURE_LABELS = {
    anti_spam: 'Spamga qarshi',
    anti_duplicate: 'Takrorga qarshi',
    anti_invite: 'Taklif havolalariga qarshi',
    anti_link: 'Havolalarga qarshi',
    anti_mention: 'Mention toshqiniga qarshi',
    anti_caps: 'KATTA HARFLARGA qarshi',
    anti_emoji: 'Emoji toshqiniga qarshi',
    word_filter: "So'z filtri",
    anti_raid: 'Reydga qarshi',
};
exports.default = (0, types_1.defineCommand)({
    category: 'config',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('automod')
        .setDescription("Avtomatik moderatsiyani sozlaydi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((sub) => sub.setName('status').setDescription("AutoMod sozlamalarini ko'rsatadi"))
        .addSubcommand((sub) => sub
        .setName('enable')
        .setDescription("AutoMod ni umumiy yoqadi yoki o'chiradi")
        .addBooleanOption((option) => option.setName('value').setDescription('Yoqilsinmi?').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('toggle')
        .setDescription("Bitta qoidani yoqadi yoki o'chiradi")
        .addStringOption((option) => option
        .setName('feature')
        .setDescription('Qoida')
        .setRequired(true)
        .addChoices({ name: 'Spam', value: 'anti_spam' }, { name: 'Takroriy xabar', value: 'anti_duplicate' }, { name: 'Taklif havolalari', value: 'anti_invite' }, { name: 'Havolalar', value: 'anti_link' }, { name: 'Mention toshqini', value: 'anti_mention' }, { name: 'KATTA HARFLAR', value: 'anti_caps' }, { name: 'Emoji toshqini', value: 'anti_emoji' }, { name: "So'z filtri", value: 'word_filter' }, { name: 'Reyd himoyasi', value: 'anti_raid' }))
        .addBooleanOption((option) => option.setName('value').setDescription('Yoqilsinmi?').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('punishment')
        .setDescription("Qoida buzilganda qanday jazo qo'llanadi")
        .addStringOption((option) => option
        .setName('action')
        .setDescription('Jazo')
        .setRequired(true)
        .addChoices({ name: "Faqat xabarni o'chirish", value: 'delete' }, { name: 'Ogohlantirish', value: 'warn' }, { name: 'Timeout', value: 'timeout' }, { name: 'Kick', value: 'kick' }, { name: 'Ban', value: 'ban' }))
        .addStringOption((option) => option.setName('duration').setDescription('Timeout/ban muddati, masalan 10m')))
        .addSubcommand((sub) => sub
        .setName('limit')
        .setDescription("Qoidalarning sonli chegaralarini o'zgartiradi")
        .addStringOption((option) => option
        .setName('name')
        .setDescription('Chegara')
        .setRequired(true)
        .addChoices({ name: 'Spam: xabarlar soni', value: 'spam_limit' }, { name: 'Spam: oyna (soniya)', value: 'spam_window_ms' }, { name: 'Mention: maksimal son', value: 'mention_limit' }, { name: 'CAPS: foiz chegarasi', value: 'caps_percent' }, { name: 'Emoji: maksimal son', value: 'emoji_limit' }, { name: "Reyd: a'zolar soni", value: 'raid_join_limit' }, { name: 'Reyd: oyna (soniya)', value: 'raid_window_ms' }, { name: 'Minimal akkaunt yoshi (kun)', value: 'min_account_age_days' }))
        .addIntegerOption((option) => option
        .setName('value')
        .setDescription('Yangi qiymat')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(1000)))
        .addSubcommand((sub) => sub
        .setName('ignore')
        .setDescription("Kanal yoki rolni AutoMod tekshiruvidan ozod qiladi")
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription('Kanal')
        .addChannelTypes(discord_js_1.ChannelType.GuildText, discord_js_1.ChannelType.GuildForum))
        .addRoleOption((option) => option.setName('role').setDescription('Rol')))
        .addSubcommand((sub) => sub
        .setName('word')
        .setDescription("Taqiqlangan so'zlar ro'yxatini boshqaradi")
        .addStringOption((option) => option
        .setName('action')
        .setDescription('Amal')
        .setRequired(true)
        .addChoices({ name: "Qo'shish", value: 'add' }, { name: "O'chirish", value: 'remove' }, { name: "Ro'yxat", value: 'list' }))
        .addStringOption((option) => option.setName('word').setDescription("So'z (add/remove uchun)").setMaxLength(60)))
        .addSubcommand((sub) => sub
        .setName('domain')
        .setDescription("Ruxsat etilgan domenlar ro'yxatini boshqaradi")
        .addStringOption((option) => option
        .setName('action')
        .setDescription('Amal')
        .setRequired(true)
        .addChoices({ name: "Qo'shish/o'chirish", value: 'toggle' }, { name: "Ro'yxat", value: 'list' }))
        .addStringOption((option) => option.setName('domain').setDescription('Masalan: youtube.com').setMaxLength(100))),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guildId = interaction.guildId;
        const sub = interaction.options.getSubcommand();
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        // ── status ──────────────────────────────────────────────────────────────
        if (sub === 'status') {
            const settings = (0, automod_1.getAutoMod)(guildId);
            const embed = (0, embeds_1.brandEmbed)(t('automod.settingsTitle')).setDescription(settings.enabled ? `🟢 AutoMod ${t('common.enabled')}` : `🔴 AutoMod ${t('common.disabled')}`);
            const rules = automod_1.TOGGLE_FEATURES.map((feature) => {
                const on = settings[feature] === true;
                return `${on ? '🟢' : '🔴'} ${FEATURE_LABELS[feature]}`;
            });
            const words = (0, automod_1.listWords)(guildId);
            const domains = (0, automod_1.parseList)(settings.allowed_domains);
            const channels = (0, automod_1.parseList)(settings.ignored_channels);
            const roles = (0, automod_1.parseList)(settings.ignored_roles);
            embed.addFields({ name: 'Qoidalar', value: rules.join('\n') }, {
                name: 'Jazo',
                value: `\`${settings.punishment}\`${['timeout', 'ban'].includes(settings.punishment) && settings.punishment_ms > 0
                    ? ` — ${(0, time_1.formatDuration)(settings.punishment_ms)}`
                    : ''}`,
                inline: true,
            }, {
                name: 'Chegaralar',
                value: [
                    `Spam: ${settings.spam_limit} / ${Math.round(settings.spam_window_ms / 1000)}s`,
                    `Mention: ${settings.mention_limit}`,
                    `CAPS: ${settings.caps_percent}%`,
                    `Emoji: ${settings.emoji_limit}`,
                    `Reyd: ${settings.raid_join_limit} / ${Math.round(settings.raid_window_ms / 1000)}s`,
                    `Akkaunt yoshi: ${settings.min_account_age_days} kun`,
                ].join('\n'),
            }, {
                name: "Taqiqlangan so'zlar",
                value: words.length > 0 ? `${words.length} ta` : t('common.none'),
                inline: true,
            }, {
                name: 'Ruxsat etilgan domenlar',
                value: domains.length > 0 ? (0, embeds_1.truncate)(domains.join(', '), 500) : t('common.none'),
                inline: true,
            }, {
                name: "E'tiborsiz qoldiriladi",
                value: [
                    channels.map((id) => `<#${id}>`).join(' '),
                    roles.map((id) => `<@&${id}>`).join(' '),
                ]
                    .filter(Boolean)
                    .join('\n') || t('common.none'),
            });
            await (0, actions_1.reply)(interaction, embed, true);
            return;
        }
        // ── enable ──────────────────────────────────────────────────────────────
        if (sub === 'enable') {
            const value = interaction.options.getBoolean('value', true);
            await (0, automod_1.updateAutoMod)(guildId, { enabled: value });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('automod.toggled', {
                feature: 'AutoMod',
                state: value ? t('common.enabled') : t('common.disabled'),
            })), true);
            return;
        }
        // ── toggle ──────────────────────────────────────────────────────────────
        if (sub === 'toggle') {
            const feature = interaction.options.getString('feature', true);
            const value = interaction.options.getBoolean('value', true);
            await (0, automod_1.updateAutoMod)(guildId, { [feature]: value });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('automod.toggled', {
                feature: FEATURE_LABELS[feature],
                state: value ? t('common.enabled') : t('common.disabled'),
            })), true);
            return;
        }
        // ── punishment ──────────────────────────────────────────────────────────
        if (sub === 'punishment') {
            const action = interaction.options.getString('action', true);
            const durationRaw = interaction.options.getString('duration');
            let durationMs = 0;
            if (durationRaw) {
                const parsed = (0, time_1.parseDuration)(durationRaw);
                if (parsed === null) {
                    await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.invalidDuration')), true);
                    return;
                }
                durationMs = parsed;
            }
            else if (action === 'timeout') {
                durationMs = 10 * 60 * 1000;
            }
            await (0, automod_1.updateAutoMod)(guildId, { punishment: action, punishment_ms: durationMs });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('automod.punishmentSet', {
                punishment: action,
                duration: durationMs > 0 ? `(${(0, time_1.formatDuration)(durationMs)})` : '',
            })), true);
            return;
        }
        // ── limit ───────────────────────────────────────────────────────────────
        if (sub === 'limit') {
            const name = interaction.options.getString('name', true);
            const raw = interaction.options.getInteger('value', true);
            const value = name.endsWith('_window_ms') ? raw * 1000 : raw;
            await (0, automod_1.updateAutoMod)(guildId, { [name]: value });
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('automod.limitSet', { name, value: raw })), true);
            return;
        }
        // ── ignore ──────────────────────────────────────────────────────────────
        if (sub === 'ignore') {
            const channel = interaction.options.getChannel('channel');
            const role = interaction.options.getRole('role');
            if (!channel && !role) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)("Kanal yoki rol tanlang."), true);
                return;
            }
            const messages = [];
            if (channel) {
                const { added } = await (0, automod_1.toggleInList)(guildId, 'ignored_channels', channel.id);
                messages.push(t(added ? 'automod.ignoreAdded' : 'automod.ignoreRemoved', {
                    target: `<#${channel.id}>`,
                }));
            }
            if (role) {
                const { added } = await (0, automod_1.toggleInList)(guildId, 'ignored_roles', role.id);
                messages.push(t(added ? 'automod.ignoreAdded' : 'automod.ignoreRemoved', {
                    target: `<@&${role.id}>`,
                }));
            }
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(messages.join('\n')), true);
            return;
        }
        // ── word ────────────────────────────────────────────────────────────────
        if (sub === 'word') {
            const action = interaction.options.getString('action', true);
            const word = interaction.options.getString('word')?.trim().toLowerCase();
            if (action === 'list') {
                const words = (0, automod_1.listWords)(guildId);
                const embed = (0, embeds_1.infoEmbed)(words.length > 0
                    ? (0, embeds_1.truncate)(words.map((item) => `\`${item}\``).join(', '), 3500)
                    : t('automod.wordListEmpty'), t('automod.wordList', { count: words.length }));
                await (0, actions_1.reply)(interaction, embed, true);
                return;
            }
            if (!word) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)("So'zni kiriting."), true);
                return;
            }
            if (action === 'add') {
                const added = await (0, automod_1.addWord)(guildId, word);
                await (0, actions_1.reply)(interaction, added
                    ? (0, embeds_1.successEmbed)(t('automod.wordAdded', { word }))
                    : (0, embeds_1.errorEmbed)(t('automod.wordExists', { word })), true);
                return;
            }
            const removed = await (0, automod_1.removeWord)(guildId, word);
            await (0, actions_1.reply)(interaction, removed
                ? (0, embeds_1.successEmbed)(t('automod.wordRemoved', { word }))
                : (0, embeds_1.errorEmbed)(t('automod.wordMissing', { word })), true);
            return;
        }
        // ── domain ──────────────────────────────────────────────────────────────
        if (sub === 'domain') {
            const action = interaction.options.getString('action', true);
            const domain = interaction.options
                .getString('domain')
                ?.trim()
                .toLowerCase()
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\/.*$/, '');
            if (action === 'list') {
                const domains = (0, automod_1.parseList)((0, automod_1.getAutoMod)(guildId).allowed_domains);
                await (0, actions_1.reply)(interaction, (0, embeds_1.infoEmbed)(domains.length > 0 ? domains.map((item) => `\`${item}\``).join(', ') : t('common.none'), 'Ruxsat etilgan domenlar'), true);
                return;
            }
            if (!domain) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)('Domen kiriting.'), true);
                return;
            }
            const { added } = await (0, automod_1.toggleInList)(guildId, 'allowed_domains', domain);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t(added ? 'automod.ignoreAdded' : 'automod.ignoreRemoved', { target: `\`${domain}\`` })), true);
        }
    },
});
//# sourceMappingURL=automod.js.map