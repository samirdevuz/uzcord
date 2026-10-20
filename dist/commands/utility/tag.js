"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const tags_1 = require("../../db/tags");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const validation_1 = require("../../utils/validation");
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('tag')
        .setDescription('Server taglari — tez-tez yuboriladigan matnlar')
        .setDMPermission(false)
        .addSubcommand((sub) => sub
        .setName('use')
        .setDescription('Tagni yuboradi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true).setAutocomplete(true))
        .addUserOption((opt) => opt.setName('user').setDescription('Kimga qaratilgan (eslatib o\'tiladi)')))
        .addSubcommand((sub) => sub
        .setName('create')
        .setDescription('Yangi tag yaratadi')
        .addStringOption((opt) => opt.setName('name').setDescription('Nomi (harf, raqam, - va _)').setRequired(true).setMaxLength(32))
        .addStringOption((opt) => opt.setName('content').setDescription('Matni').setRequired(true).setMaxLength(2000))
        .addBooleanOption((opt) => opt.setName('embed').setDescription('Embed ko\'rinishida yuborilsinmi?')))
        .addSubcommand((sub) => sub
        .setName('edit')
        .setDescription('Tag matnini o\'zgartiradi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true).setAutocomplete(true))
        .addStringOption((opt) => opt.setName('content').setDescription('Yangi matn').setRequired(true).setMaxLength(2000)))
        .addSubcommand((sub) => sub
        .setName('delete')
        .setDescription('Tagni o\'chiradi')
        .addStringOption((opt) => opt.setName('name').setDescription('Tag nomi').setRequired(true).setAutocomplete(true)))
        .addSubcommand((sub) => sub.setName('list').setDescription('Barcha taglar')),
    async autocomplete(interaction) {
        if (!interaction.guildId)
            return;
        const focused = interaction.options.getFocused();
        const names = await (0, tags_1.searchTagNames)(interaction.guildId, focused);
        await interaction.respond(names.map((name) => ({ name, value: name })));
    },
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'list') {
            const tags = await (0, tags_1.listTags)(guild.id);
            if (tags.length === 0) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('tag.listEmpty')), true);
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(embeds_1.COLORS.info)
                .setTitle(`📌 ${t('tag.listTitle', { count: tags.length })}`)
                .setDescription((0, embeds_1.truncate)(tags.map((tag) => `\`${tag.name}\` · ${tag.uses}`).join('\n'), 4000))
                .setFooter({ text: t('tag.listFooter') });
            await interaction.reply({ embeds: [embed], flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const name = (0, validation_1.normalizeTagName)(interaction.options.getString('name', true));
        if (!name) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('tag.invalidName')), true);
            return;
        }
        if (subcommand === 'create') {
            if (await (0, tags_1.getTag)(guild.id, name)) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('tag.exists', { name })), true);
                return;
            }
            const created = await (0, tags_1.createTag)({
                guild_id: guild.id,
                name,
                content: interaction.options.getString('content', true),
                as_embed: interaction.options.getBoolean('embed') ?? false,
                created_by: interaction.user.id,
            });
            await (0, actions_1.reply)(interaction, created ? (0, embeds_1.successEmbed)(t('tag.created', { name })) : (0, embeds_1.errorEmbed)(t('tag.saveFailed')), true);
            return;
        }
        const tag = await (0, tags_1.getTag)(guild.id, name);
        if (!tag) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('tag.notFound', { name })), true);
            return;
        }
        if (subcommand === 'use') {
            await (0, tags_1.incrementTagUses)(tag.id);
            const target = interaction.options.getUser('user');
            const mention = target ? `<@${target.id}>` : undefined;
            const allowedMentions = { users: target ? [target.id] : [] };
            if (tag.as_embed) {
                const embed = new discord_js_1.EmbedBuilder().setColor(embeds_1.COLORS.info).setTitle(`📌 ${tag.name}`).setDescription(tag.content);
                await interaction.reply({ content: mention, embeds: [embed], allowedMentions });
            }
            else {
                await interaction.reply({ content: mention ? `${mention}\n${tag.content}` : tag.content, allowedMentions });
            }
            return;
        }
        const canManage = tag.created_by === interaction.user.id || interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.ManageGuild);
        if (!canManage) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('tag.noPermission')), true);
            return;
        }
        if (subcommand === 'edit') {
            const ok = await (0, tags_1.updateTag)(guild.id, name, { content: interaction.options.getString('content', true) });
            await (0, actions_1.reply)(interaction, ok ? (0, embeds_1.successEmbed)(t('tag.updated', { name })) : (0, embeds_1.errorEmbed)(t('tag.saveFailed')), true);
            return;
        }
        await (0, tags_1.deleteTag)(guild.id, name);
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('tag.deleted', { name })), true);
    },
});
//# sourceMappingURL=tag.js.map