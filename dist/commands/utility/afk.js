"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.afkUsers = void 0;
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
// Global AFK state in memory: guildId:userId -> reason
exports.afkUsers = new Map();
exports.default = (0, types_1.defineCommand)({
    data: new discord_js_1.SlashCommandBuilder()
        .setName('afk')
        .setDescription('AFK (Klaviaturadan uzoqda) holatini o\'rnatadi')
        .addStringOption((opt) => opt.setName('reason').setDescription('Sabab')),
    category: 'utility',
    async execute(interaction) {
        if (!interaction.guild)
            return;
        const reason = interaction.options.getString('reason') ?? 'Sabab ko\'rsatilmadi';
        const key = `${interaction.guild.id}:${interaction.user.id}`;
        exports.afkUsers.set(key, { reason, timestamp: Date.now() });
        await interaction.reply({
            content: `💤 **${interaction.user.username}** endi AFK: *${reason}*`,
        });
    },
});
//# sourceMappingURL=afk.js.map