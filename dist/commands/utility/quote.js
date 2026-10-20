"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const validation_1 = require("../../utils/validation");
exports.default = (0, types_1.defineCommand)({
    category: 'community',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('quote')
        .setDescription('Xabardan chiroyli iqtibos keltiradi')
        .setDMPermission(false)
        .addStringOption((opt) => opt.setName('message').setDescription('Xabar havolasi (Copy Message Link) yoki shu kanaldagi xabar IDsi').setRequired(true)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const ref = (0, validation_1.parseMessageReference)(interaction.options.getString('message', true));
        if (!ref) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('quote.notFound')), true);
            return;
        }
        const channel = ref.channelId ? await guild.channels.fetch(ref.channelId).catch(() => null) : interaction.channel;
        if (!channel?.isTextBased() || channel.isDMBased() || channel.guildId !== guild.id) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('quote.notFound')), true);
            return;
        }
        // Foydalanuvchi o'zi ko'ra olmaydigan kanaldan iqtibos keltira olmasin.
        const member = interaction.member;
        if (!channel.permissionsFor(member)?.has([discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory])) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('quote.notFound')), true);
            return;
        }
        const message = await channel.messages.fetch(ref.messageId).catch(() => null);
        if (!message) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('quote.notFound')), true);
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(message.member?.displayColor || embeds_1.COLORS.info)
            .setAuthor({ name: message.member?.displayName ?? message.author.username, iconURL: message.author.displayAvatarURL() })
            .setDescription((0, embeds_1.truncate)(message.content || message.embeds[0]?.description || t('quote.mediaOnly'), 4000))
            .addFields({ name: '​', value: `[${t('quote.jump')}](${message.url}) · <#${channel.id}>` })
            .setFooter({ text: t('quote.by', { user: interaction.user.username }) })
            .setTimestamp(message.createdAt);
        const image = message.attachments.find((attachment) => attachment.contentType?.startsWith('image/'));
        if (image)
            embed.setImage(image.url);
        await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
});
//# sourceMappingURL=quote.js.map