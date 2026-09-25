"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const leveling_1 = require("../../db/leveling");
const xp_1 = require("../../utils/xp");
exports.default = (0, types_1.defineCommand)({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('rank')
        .setDescription("Foydalanuvchining XP va darajasini ko'rsatadi")
        .addUserOption((opt) => opt.setName('user').setDescription('Foydalanuvchi').setRequired(false)),
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
        const targetUser = interaction.options.getUser('user') ?? interaction.user;
        const memberData = await (0, leveling_1.getMemberLevel)(interaction.guild.id, targetUser.id);
        if (!memberData) {
            await interaction.reply({
                content: `${targetUser.tag} hali XP ga ega emas.`,
                ephemeral: true,
            });
            return;
        }
        const rank = await (0, leveling_1.getMemberRank)(interaction.guild.id, targetUser.id);
        const progress = (0, xp_1.xpProgress)(memberData.xp);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`📊 ${targetUser.username} — Rank Card`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setColor('#3b82f6')
            .addFields({ name: "O'rni (Rank)", value: `#${rank || '-'}`, inline: true }, { name: 'Daraja (Level)', value: `${progress.level}`, inline: true }, { name: 'Jami XP', value: `${memberData.xp.toLocaleString()}`, inline: true }, {
            name: 'Progress',
            value: `${progress.currentXpInLevel} / ${progress.neededXpForLevel} XP (${progress.progressPercent}%)`,
        }, { name: 'Xabarlar soni', value: `${memberData.messages.toLocaleString()}`, inline: true })
            .setFooter({ text: 'UzCord Leveling System' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
});
//# sourceMappingURL=rank.js.map