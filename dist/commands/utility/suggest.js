"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const guilds_1 = require("../../db/guilds");
exports.default = (0, types_1.defineCommand)({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Server uchun taklif yuborish')
        .addStringOption((opt) => opt.setName('text').setDescription('Taklif matni').setRequired(true)),
    category: 'utility',
    async execute(interaction) {
        if (!interaction.guild)
            return;
        const text = interaction.options.getString('text', true);
        const settings = (0, guilds_1.getSettings)(interaction.guild.id);
        // If server_log_channel_id or message_log_channel_id is set or channel named 'suggestions'
        const channel = interaction.guild.channels.cache.find((c) => c.name === 'takliflar' || c.name === 'suggestions');
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('💡 Yangi taklif')
            .setDescription(text)
            .setColor('#f59e0b')
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .addFields({ name: 'Holat', value: '⏳ Ko\'rib chiqilmoqda' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('suggest_upvote').setLabel('0').setEmoji('👍').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId('suggest_downvote').setLabel('0').setEmoji('👎').setStyle(discord_js_1.ButtonStyle.Secondary));
        if (channel && 'send' in channel) {
            await channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: `✅ Taklifingiz ${channel} kanaliga yuborildi!`, ephemeral: true });
        }
        else {
            await interaction.reply({ embeds: [embed], components: [row] });
        }
    },
});
//# sourceMappingURL=suggest.js.map