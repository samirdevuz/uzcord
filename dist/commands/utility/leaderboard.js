"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const leveling_1 = require("../../db/leveling");
const leveling_2 = require("../../modules/leveling");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const MEDALS = ['🥇', '🥈', '🥉'];
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription("Eng faol a'zolar reytingi")
        .setDMPermission(false)
        .addIntegerOption((opt) => opt.setName('page').setDescription('Sahifa').setMinValue(1).setMaxValue(50)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        if (!(await (0, leveling_2.isLevelingActive)(guild.id))) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('level.disabled')), true);
            return;
        }
        const page = interaction.options.getInteger('page') ?? 1;
        const perPage = 10;
        const rows = await (0, leveling_1.getLeaderboard)(guild.id, page * perPage);
        const slice = rows.slice((page - 1) * perPage);
        if (slice.length === 0) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('level.leaderboardEmpty')), true);
            return;
        }
        const lines = slice.map((row, index) => {
            const position = (page - 1) * perPage + index + 1;
            const badge = MEDALS[position - 1] ?? `\`#${position}\``;
            return `${badge} <@${row.user_id}> — **${row.level}**-daraja · ${Number(row.xp).toLocaleString('uz-UZ')} XP`;
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xf5c518)
            .setTitle(`🏆 ${t('level.leaderboardTitle', { guild: guild.name })}`)
            .setThumbnail(guild.iconURL({ size: 128 }))
            .setDescription(lines.join('\n'))
            .setTimestamp();
        const own = await (0, leveling_1.getMemberLevel)(guild.id, interaction.user.id);
        if (own && Number(own.xp) > 0) {
            const rank = await (0, leveling_1.getMemberRank)(guild.id, interaction.user.id);
            embed.setFooter({ text: t('level.leaderboardYou', { rank, level: own.level }) });
        }
        await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
    },
});
//# sourceMappingURL=leaderboard.js.map