"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.ManageChannels],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('unlock')
        .setDescription("Yopilgan kanalni qayta ochadi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription("Kanal (bo'sh = joriy kanal)")
        .addChannelTypes(discord_js_1.ChannelType.GuildText)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const channel = (interaction.options.getChannel('channel') ??
            interaction.channel);
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.channelType')), true);
            return;
        }
        const everyone = guild.roles.everyone;
        const current = channel.permissionOverwrites.cache.get(everyone.id);
        if (!current?.deny.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.warningEmbed)(t('mod.alreadyUnlocked')), true);
            return;
        }
        try {
            await channel.permissionOverwrites.edit(everyone, { SendMessages: null, SendMessagesInThreads: null, CreatePublicThreads: null }, { reason: `${interaction.user.tag}` });
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })), true);
            return;
        }
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.unlocked', { channel: `<#${channel.id}>` })));
    },
});
//# sourceMappingURL=unlock.js.map