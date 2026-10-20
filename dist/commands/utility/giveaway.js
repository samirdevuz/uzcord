"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const giveaways_1 = require("../../db/giveaways");
const giveaways_2 = require("../../modules/giveaways");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
const MAX_DURATION = 30 * time_1.DAY;
/** Xabar havolasi yoki ID dan xabar IDsini ajratib oladi. */
function messageIdFrom(input) {
    return input.trim().split('/').pop().replace(/\D/g, '');
}
exports.default = (0, types_1.defineCommand)({
    category: 'community',
    botPermissions: [discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.EmbedLinks],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Konkurs (giveaway) yaratish va boshqarish')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addSubcommand((sub) => sub
        .setName('create')
        .setDescription('Yangi konkurs boshlaydi')
        .addStringOption((opt) => opt.setName('prize').setDescription('Yutuq').setRequired(true).setMaxLength(200))
        .addStringOption((opt) => opt.setName('duration').setDescription('Davomiyligi: 30m, 2h, 1d (ko\'pi bilan 30 kun)').setRequired(true))
        .addIntegerOption((opt) => opt.setName('winners').setDescription("G'oliblar soni").setMinValue(1).setMaxValue(20))
        .addChannelOption((opt) => opt.setName('channel').setDescription('Kanal').addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addRoleOption((opt) => opt.setName('required_role').setDescription('Qatnashish uchun kerakli rol'))
        .addStringOption((opt) => opt.setName('description').setDescription('Tavsif').setMaxLength(1000)))
        .addSubcommand((sub) => sub
        .setName('end')
        .setDescription('Konkursni muddatidan oldin yakunlaydi')
        .addStringOption((opt) => opt.setName('message').setDescription('Konkurs xabarining IDsi yoki havolasi').setRequired(true)))
        .addSubcommand((sub) => sub
        .setName('reroll')
        .setDescription("Yakunlangan konkurs uchun yangi g'olib tanlaydi")
        .addStringOption((opt) => opt.setName('message').setDescription('Konkurs xabarining IDsi yoki havolasi').setRequired(true))
        .addIntegerOption((opt) => opt.setName('winners').setDescription("Nechta yangi g'olib").setMinValue(1).setMaxValue(10))),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'create') {
            const prize = interaction.options.getString('prize', true);
            const durationMs = (0, time_1.parseDuration)(interaction.options.getString('duration', true));
            const winnerCount = interaction.options.getInteger('winners') ?? 1;
            const channel = (interaction.options.getChannel('channel') ?? interaction.channel);
            const role = interaction.options.getRole('required_role');
            const description = interaction.options.getString('description');
            if (!durationMs || durationMs < time_1.MINUTE || durationMs > MAX_DURATION) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('giveaway.invalidDuration')), true);
                return;
            }
            if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.channelType')), true);
                return;
            }
            const me = guild.members.me;
            if (!channel.permissionsFor(me)?.has([discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.EmbedLinks])) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('giveaway.noPermission', { channel: `<#${channel.id}>` })), true);
                return;
            }
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const draft = {
                guild_id: guild.id,
                channel_id: channel.id,
                message_id: null,
                prize,
                description,
                winner_count: winnerCount,
                host_id: interaction.user.id,
                required_role_id: role?.id ?? null,
                required_level: null,
                ends_at: new Date(Date.now() + durationMs).toISOString(),
            };
            const preview = { ...draft, id: 0, ended: false, winners: [], created_at: new Date().toISOString() };
            const message = await channel.send({
                embeds: [(0, giveaways_2.buildGiveawayEmbed)(preview, t, { entries: 0, ended: false })],
                components: (0, giveaways_2.giveawayComponents)(t, 0, false),
            });
            const saved = await (0, giveaways_1.createGiveaway)({ ...draft, message_id: message.id });
            if (!saved) {
                await message.delete().catch(() => null);
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.generic')));
                return;
            }
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('giveaway.created', { channel: `<#${channel.id}>` })));
            return;
        }
        const giveaway = await (0, giveaways_1.getGiveawayByMessage)(messageIdFrom(interaction.options.getString('message', true)));
        if (!giveaway || giveaway.guild_id !== guild.id) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('giveaway.notFound')), true);
            return;
        }
        if (subcommand === 'end') {
            if (giveaway.ended) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('giveaway.ended')), true);
                return;
            }
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const winners = await (0, giveaways_2.finishGiveaway)(interaction.client, giveaway);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(winners ? t('giveaway.endedManual') : t('giveaway.ended')));
            return;
        }
        // reroll
        if (!giveaway.ended) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('giveaway.notEnded')), true);
            return;
        }
        const fresh = await (0, giveaways_2.rerollGiveaway)(giveaway, interaction.options.getInteger('winners') ?? 1);
        if (fresh.length === 0) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('giveaway.noReroll')), true);
            return;
        }
        await interaction.reply({
            content: t('giveaway.rerolled', { winners: fresh.map((id) => `<@${id}>`).join(', '), prize: giveaway.prize }),
            allowedMentions: { users: fresh },
        });
    },
});
//# sourceMappingURL=giveaway.js.map