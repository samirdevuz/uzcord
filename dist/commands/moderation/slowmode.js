"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
const MAX_SLOWMODE = 21600; // Discord chegarasi: 6 soat
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.ManageChannels],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('slowmode')
        .setDescription("Kanalda sekin rejimni o'rnatadi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addStringOption((option) => option
        .setName('duration')
        .setDescription("Masalan: 10s, 2m, 1h. O'chirish uchun: 0")
        .setRequired(true))
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription("Kanal (bo'sh = joriy kanal)")
        .addChannelTypes(discord_js_1.ChannelType.GuildText)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const raw = interaction.options.getString('duration', true).trim();
        const channel = (interaction.options.getChannel('channel') ??
            interaction.channel);
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.channelType')), true);
            return;
        }
        let seconds;
        if (raw === '0' || raw.toLowerCase() === 'off') {
            seconds = 0;
        }
        else {
            const ms = (0, time_1.parseDuration)(raw);
            if (ms === null) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.invalidDuration')), true);
                return;
            }
            seconds = Math.min(Math.floor(ms / 1000), MAX_SLOWMODE);
        }
        try {
            await channel.setRateLimitPerUser(seconds, `${interaction.user.tag}`);
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })), true);
            return;
        }
        const message = seconds === 0
            ? t('mod.slowmodeOff', { channel: `<#${channel.id}>` })
            : t('mod.slowmodeSet', {
                channel: `<#${channel.id}>`,
                duration: (0, time_1.formatDuration)(seconds * 1000),
            });
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(message));
    },
});
//# sourceMappingURL=slowmode.js.map