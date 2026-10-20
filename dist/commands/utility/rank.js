"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const leveling_1 = require("../../db/leveling");
const leveling_2 = require("../../modules/leveling");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const xp_1 = require("../../utils/xp");
exports.default = (0, types_1.defineCommand)({
    category: 'community',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('rank')
        .setDescription("Daraja, XP va reytingdagi o'rinni ko'rsatadi")
        .setDMPermission(false)
        .addUserOption((opt) => opt.setName('user').setDescription('Foydalanuvchi')),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        if (!(await (0, leveling_2.isLevelingActive)(guild.id))) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('level.disabled')), true);
            return;
        }
        const user = interaction.options.getUser('user') ?? interaction.user;
        if (user.bot) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('level.noXp', { user: user.username })), true);
            return;
        }
        const data = await (0, leveling_1.getMemberLevel)(guild.id, user.id);
        if (!data || Number(data.xp) <= 0) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('level.noXp', { user: user.username })), true);
            return;
        }
        const xp = Number(data.xp);
        const rank = await (0, leveling_1.getMemberRank)(guild.id, user.id);
        const progress = (0, xp_1.xpProgress)(xp);
        const member = await guild.members.fetch(user.id).catch(() => null);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(member?.displayColor || embeds_1.COLORS.brand)
            .setAuthor({ name: t('level.rankTitle', { user: member?.displayName ?? user.username }), iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields({ name: t('level.rank'), value: rank ? `#${rank}` : '—', inline: true }, { name: t('level.level'), value: String(progress.level), inline: true }, { name: t('level.totalXp'), value: xp.toLocaleString('uz-UZ'), inline: true }, {
            name: t('level.progress', { level: progress.level + 1 }),
            value: `\`${(0, leveling_2.progressBar)(progress.progressPercent, 16)}\` **${progress.progressPercent}%**\n` +
                `${progress.currentXpInLevel.toLocaleString('uz-UZ')} / ${progress.neededXpForLevel.toLocaleString('uz-UZ')} XP`,
        }, { name: t('level.messages'), value: Number(data.messages).toLocaleString('uz-UZ'), inline: true })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
});
//# sourceMappingURL=rank.js.map