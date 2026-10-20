"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const afk_1 = require("../../modules/afk");
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    cooldown: 10,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('afk')
        .setDescription('AFK holatini yoqadi — sizni eslatganlarga sabab ko\'rsatiladi')
        .setDMPermission(false)
        .addStringOption((opt) => opt.setName('reason').setDescription('Sabab').setMaxLength(200)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const member = interaction.member;
        const reason = interaction.options.getString('reason') ?? t('afk.noReason');
        await (0, afk_1.setAfk)(member, reason);
        await interaction.reply({ content: t('afk.set', { user: member.displayName, reason }), allowedMentions: { parse: [] } });
    },
});
//# sourceMappingURL=afk.js.map