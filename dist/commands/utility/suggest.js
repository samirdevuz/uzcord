"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
/** Takliflar kanali nomi bo'yicha topiladi (masalan #takliflar yoki #suggestions). */
const CHANNEL_HINTS = ['takliflar', 'taklif', 'suggestions', 'suggestion', 'предложения'];
exports.default = (0, types_1.defineCommand)({
    category: 'community',
    cooldown: 60,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Server uchun taklif yuboradi')
        .setDMPermission(false)
        .addStringOption((opt) => opt.setName('text').setDescription('Taklif matni').setRequired(true).setMinLength(10).setMaxLength(2000)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const me = guild.members.me;
        const text = interaction.options.getString('text', true);
        const named = guild.channels.cache.find((channel) => channel.type === discord_js_1.ChannelType.GuildText && CHANNEL_HINTS.some((hint) => channel.name.toLowerCase().includes(hint)));
        const target = (named ?? interaction.channel);
        if (!target || target.type !== discord_js_1.ChannelType.GuildText) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.channelType')), true);
            return;
        }
        const permissions = target.permissionsFor(me);
        if (!permissions?.has([discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.EmbedLinks, discord_js_1.PermissionFlagsBits.AddReactions])) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.botMissingPermission', { permissions: 'SendMessages, EmbedLinks, AddReactions' })), true);
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embeds_1.COLORS.warning)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setTitle(`💡 ${t('suggest.title')}`)
            .setDescription(text)
            .setFooter({ text: t('suggest.footer') })
            .setTimestamp();
        const message = await target.send({ embeds: [embed] });
        await message.react('👍').catch(() => null);
        await message.react('👎').catch(() => null);
        if (permissions.has(discord_js_1.PermissionFlagsBits.CreatePublicThreads)) {
            await message
                .startThread({ name: `💬 ${text.slice(0, 80)}`, autoArchiveDuration: 10080 })
                .catch(() => null);
        }
        await interaction.reply({
            embeds: [(0, embeds_1.successEmbed)(t('suggest.sent', { link: message.url }))],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    },
});
//# sourceMappingURL=suggest.js.map