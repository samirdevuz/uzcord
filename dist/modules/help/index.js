"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORIES = exports.HELP_SELECT = void 0;
exports.inviteUrl = inviteUrl;
exports.linkButtons = linkButtons;
exports.buildHelpHome = buildHelpHome;
exports.buildHelpCategory = buildHelpCategory;
exports.buildCommandDetail = buildCommandDetail;
exports.handleHelpSelect = handleHelpSelect;
const discord_js_1 = require("discord.js");
const config_1 = require("../../core/config");
const guilds_1 = require("../../db/guilds");
const i18n_1 = require("../../i18n");
const embeds_1 = require("../../utils/embeds");
exports.HELP_SELECT = 'help:category';
exports.CATEGORIES = [
    { id: 'moderation', icon: '🛡️', label: 'util.helpCategoryModeration', blurb: 'util.helpBlurbModeration' },
    { id: 'config', icon: '⚙️', label: 'util.helpCategoryConfig', blurb: 'util.helpBlurbConfig' },
    { id: 'community', icon: '🎉', label: 'util.helpCategoryCommunity', blurb: 'util.helpBlurbCommunity' },
    { id: 'music', icon: '🎵', label: 'util.helpCategoryMusic', blurb: 'util.helpBlurbMusic' },
    { id: 'utility', icon: '🧰', label: 'util.helpCategoryUtility', blurb: 'util.helpBlurbUtility' },
];
/** Botning barcha modullari uchun kerakli ruxsatlar. */
const INVITE_PERMISSIONS = new discord_js_1.PermissionsBitField([
    discord_js_1.PermissionFlagsBits.ViewChannel,
    discord_js_1.PermissionFlagsBits.SendMessages,
    discord_js_1.PermissionFlagsBits.SendMessagesInThreads,
    discord_js_1.PermissionFlagsBits.EmbedLinks,
    discord_js_1.PermissionFlagsBits.AttachFiles,
    discord_js_1.PermissionFlagsBits.ReadMessageHistory,
    discord_js_1.PermissionFlagsBits.AddReactions,
    discord_js_1.PermissionFlagsBits.UseExternalEmojis,
    discord_js_1.PermissionFlagsBits.ManageMessages,
    discord_js_1.PermissionFlagsBits.ManageChannels,
    discord_js_1.PermissionFlagsBits.ManageRoles,
    discord_js_1.PermissionFlagsBits.ManageNicknames,
    discord_js_1.PermissionFlagsBits.ManageThreads,
    discord_js_1.PermissionFlagsBits.CreatePublicThreads,
    discord_js_1.PermissionFlagsBits.KickMembers,
    discord_js_1.PermissionFlagsBits.BanMembers,
    discord_js_1.PermissionFlagsBits.ModerateMembers,
    discord_js_1.PermissionFlagsBits.MoveMembers,
    discord_js_1.PermissionFlagsBits.Connect,
    discord_js_1.PermissionFlagsBits.Speak,
]).bitfield;
/** Bot taklif havolasi — kerakli ruxsatlar bilan. */
function inviteUrl(clientId) {
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot+applications.commands&permissions=${INVITE_PERMISSIONS}`;
}
function linkButtons(t, clientId) {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setStyle(discord_js_1.ButtonStyle.Link).setLabel(t('util.helpDashboard')).setEmoji('🖥️').setURL(config_1.config.dashboardUrl), new discord_js_1.ButtonBuilder().setStyle(discord_js_1.ButtonStyle.Link).setLabel(t('util.helpInvite')).setEmoji('➕').setURL(inviteUrl(clientId)), new discord_js_1.ButtonBuilder().setStyle(discord_js_1.ButtonStyle.Link).setLabel(t('util.helpSupport')).setEmoji('💬').setURL(config_1.config.supportUrl));
}
function categoryMenu(t, client, selected) {
    const menu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(exports.HELP_SELECT)
        .setPlaceholder(t('util.helpPlaceholder'))
        .addOptions({ label: t('util.helpHome'), value: 'home', emoji: '🏠', default: !selected }, ...exports.CATEGORIES.map((category) => ({
        label: t(category.label),
        description: t('util.helpCommandCount', { count: commandsIn(client, category.id).length }),
        value: category.id,
        emoji: category.icon,
        default: selected === category.id,
    })));
    return new discord_js_1.ActionRowBuilder().addComponents(menu);
}
function commandsIn(client, category) {
    return [...client.commands.values()]
        .filter((command) => command.category === category)
        .sort((a, b) => a.data.name.localeCompare(b.data.name));
}
function subcommandNames(command) {
    const options = (command.data.toJSON().options ?? []);
    return options
        .filter((option) => option.type === discord_js_1.ApplicationCommandOptionType.Subcommand)
        .map((option) => option.name);
}
function buildHelpHome(client, t) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.brand)
        .setAuthor({ name: t('util.helpTitle'), iconURL: client.user?.displayAvatarURL() })
        .setDescription(t('util.helpIntro', { count: client.commands.size }))
        .setThumbnail(client.user?.displayAvatarURL({ size: 256 }) ?? null)
        .setFooter((0, embeds_1.brandFooter)(t('util.helpDescription')));
    for (const category of exports.CATEGORIES) {
        const count = commandsIn(client, category.id).length;
        if (count === 0)
            continue;
        embed.addFields({ name: `${category.icon} ${t(category.label)} · ${count}`, value: t(category.blurb), inline: true });
    }
    return { embeds: [embed], components: [categoryMenu(t, client), linkButtons(t, client.user.id)] };
}
function buildHelpCategory(client, t, categoryId) {
    const category = exports.CATEGORIES.find((item) => item.id === categoryId);
    const lines = commandsIn(client, categoryId).map((command) => {
        const json = command.data.toJSON();
        const subs = subcommandNames(command);
        const subLine = subs.length > 0 ? `\n  ↳ ${subs.map((name) => `\`${name}\``).join(' · ')}` : '';
        return `**\`/${json.name}\`** — ${json.description}${subLine}`;
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.brand)
        .setTitle(`${category.icon} ${t(category.label)}`)
        .setDescription((0, embeds_1.truncate)(`${t(category.blurb)}\n\n${lines.join('\n')}`, 4000))
        .setFooter((0, embeds_1.brandFooter)(t('util.helpDescription')));
    return { embeds: [embed], components: [categoryMenu(t, client, categoryId), linkButtons(t, client.user.id)] };
}
/** Bitta komanda haqida batafsil: subkomandalar va parametrlar. */
function buildCommandDetail(command, t) {
    const json = command.data.toJSON();
    const category = exports.CATEGORIES.find((item) => item.id === command.category);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.brand)
        .setTitle(`/${json.name}`)
        .setDescription(json.description)
        .setFooter((0, embeds_1.brandFooter)());
    const options = (json.options ?? []);
    const describe = (option) => {
        const required = 'required' in option && option.required ? '' : '?';
        return `\`${option.name}${required}\` — ${option.description}`;
    };
    const subs = options.filter((option) => option.type === discord_js_1.ApplicationCommandOptionType.Subcommand);
    if (subs.length > 0) {
        embed.addFields({
            name: t('util.helpSubcommands'),
            value: (0, embeds_1.truncate)(subs
                .map((sub) => {
                const params = ('options' in sub && sub.options ? sub.options : []);
                const signature = params.map((param) => ('required' in param && param.required ? `<${param.name}>` : `[${param.name}]`)).join(' ');
                return `**\`/${json.name} ${sub.name}${signature ? ` ${signature}` : ''}\`**\n${sub.description}`;
            })
                .join('\n'), 1024),
        });
    }
    else if (options.length > 0) {
        embed.addFields({ name: t('util.helpOptions'), value: (0, embeds_1.truncate)(options.map(describe).join('\n'), 1024) });
    }
    if (category)
        embed.addFields({ name: t('util.helpCategory'), value: `${category.icon} ${t(category.label)}`, inline: true });
    if (command.cooldown)
        embed.addFields({ name: t('util.helpCooldown'), value: `${command.cooldown}s`, inline: true });
    return embed;
}
async function handleHelpSelect(interaction) {
    if (interaction.customId !== exports.HELP_SELECT)
        return false;
    const client = interaction.client;
    const t = (0, i18n_1.createTranslator)(interaction.guildId ? (0, guilds_1.getSettings)(interaction.guildId).locale : config_1.config.defaultLocale);
    const value = interaction.values[0];
    const view = value === 'home' || !exports.CATEGORIES.some((category) => category.id === value)
        ? buildHelpHome(client, t)
        : buildHelpCategory(client, t, value);
    await interaction.update(view);
    return true;
}
//# sourceMappingURL=index.js.map