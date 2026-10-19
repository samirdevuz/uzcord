"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
exports.default = (0, types_1.defineCommand)({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('quote')
        .setDescription('Discord xabaridan iqtibos (quote) keltiradi')
        .addStringOption((opt) => opt.setName('message_id').setDescription('Iqtibos olinadigan xabar IDsi').setRequired(true)),
    category: 'utility',
    async execute(interaction) {
        if (!interaction.guild || !interaction.channel)
            return;
        const messageId = interaction.options.getString('message_id', true);
        const targetMsg = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (!targetMsg) {
            await interaction.reply({
                content: "Xabar ushbu kanalda topilmadi yoki botga ruxsat yetarli emas.",
                ephemeral: true,
            });
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setAuthor({
            name: targetMsg.author.tag,
            iconURL: targetMsg.author.displayAvatarURL(),
        })
            .setDescription(targetMsg.content || '*(Faqat media/birikma)*')
            .setColor('#3b82f6')
            .addFields({
            name: 'Asl xabar',
            value: `[O'tish](${targetMsg.url})`,
        })
            .setTimestamp(targetMsg.createdAt)
            .setFooter({ text: `Iqtibos keltirdi: ${interaction.user.tag}` });
        if (targetMsg.attachments.size > 0) {
            const firstAttachment = targetMsg.attachments.first();
            if (firstAttachment?.contentType?.startsWith('image/')) {
                embed.setImage(firstAttachment.url);
            }
        }
        await interaction.reply({ embeds: [embed] });
    },
});
//# sourceMappingURL=quote.js.map