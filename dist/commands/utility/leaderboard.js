"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const leveling_1 = require("../../db/leveling");
exports.default = (0, types_1.defineCommand)({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription("Serverning eng faol a'zolari peshqadambol jadvali"),
    category: 'utility',
    async execute(interaction) {
        if (!interaction.guild)
            return;
        const levelSettings = await (0, leveling_1.getLevelSettings)(interaction.guild.id);
        if (!levelSettings.enabled) {
            await interaction.reply({
                content: "Ushbu serverda leveling / XP tizimi o'chirilgan.",
                ephemeral: true,
            });
            return;
        }
        const leaderboard = await (0, leveling_1.getLeaderboard)(interaction.guild.id, 10);
        if (leaderboard.length === 0) {
            await interaction.reply({
                content: "Peshqadambol jadvali hali bo'sh.",
                ephemeral: true,
            });
            return;
        }
        const lines = leaderboard.map((item, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `\`#${index + 1}\``;
            const tag = item.user_tag ?? `<@${item.user_id}>`;
            return `${medal} **${tag}** — Level **${item.level}** (${item.xp.toLocaleString()} XP)`;
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`🏆 ${interaction.guild.name} — Leaderboard`)
            .setDescription(lines.join('\n'))
            .setColor('#f59e0b')
            .setFooter({ text: 'UzCord Leveling System' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
});
//# sourceMappingURL=leaderboard.js.map