"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    guildOnly: false,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription("Botning javob tezligini tekshiradi"),
    async execute(interaction, ctx) {
        const { t, client } = ctx;
        const sent = Date.now();
        await interaction.deferReply();
        const embed = (0, embeds_1.brandEmbed)(`🏓 ${t('util.pong')}`).addFields({ name: t('util.latencyApi'), value: `${Date.now() - sent} ms`, inline: true }, {
            name: t('util.latencyWs'),
            value: `${Math.max(client.ws.ping, 0)} ms`,
            inline: true,
        }, {
            name: t('util.uptime'),
            value: (0, time_1.formatDuration)(client.uptime ?? 0, 3),
            inline: true,
        });
        await (0, actions_1.reply)(interaction, embed);
    },
});
//# sourceMappingURL=ping.js.map