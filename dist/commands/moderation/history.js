"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const cases_1 = require("../../db/cases");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('history')
        .setDescription("Foydalanuvchining barcha moderatsiya tarixini ko'rsatadi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addUserOption((option) => option.setName('user').setDescription("Foydalanuvchi").setRequired(true)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const user = interaction.options.getUser('user', true);
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const cases = await (0, cases_1.getUserCases)(interaction.guildId, user.id, 20);
        const embed = (0, embeds_1.infoEmbed)(undefined, t('mod.historyTitle', { user: user.tag })).setThumbnail(user.displayAvatarURL());
        if (cases.length === 0) {
            embed.setDescription(t('mod.historyEmpty'));
            await (0, actions_1.reply)(interaction, embed, true);
            return;
        }
        const lines = cases.map((item) => {
            const emoji = embeds_1.CASE_EMOJI[item.type] ?? '📋';
            const state = item.active ? '' : ' *(bekor qilingan)*';
            return (`${emoji} **#${item.case_number}** \`${item.type}\` — ${(0, time_1.shortDate)(item.created_at)}${state}\n` +
                `↳ ${(0, embeds_1.truncate)(item.reason ?? t('common.noReason'), 120)}`);
        });
        embed.setDescription((0, embeds_1.truncate)(lines.join('\n'), 4000));
        await (0, actions_1.reply)(interaction, embed, true);
    },
});
//# sourceMappingURL=history.js.map