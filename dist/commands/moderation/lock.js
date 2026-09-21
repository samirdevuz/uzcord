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
        .setName('lock')
        .setDescription("Kanalni yopadi (oddiy a'zolar yoza olmaydi)")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels)
        .setDMPermission(false)
        .addChannelOption((option) => option
        .setName('channel')
        .setDescription("Kanal (bo'sh = joriy kanal)")
        .addChannelTypes(discord_js_1.ChannelType.GuildText))
        .addStringOption((option) => option.setName('reason').setDescription("Sabab").setMaxLength(400)),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const channel = (interaction.options.getChannel('channel') ??
            interaction.channel);
        const reason = interaction.options.getString('reason');
        if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.channelType')), true);
            return;
        }
        const everyone = guild.roles.everyone;
        const current = channel.permissionOverwrites.cache.get(everyone.id);
        if (current?.deny.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.warningEmbed)(t('mod.alreadyLocked')), true);
            return;
        }
        try {
            await channel.permissionOverwrites.edit(everyone, { SendMessages: false, SendMessagesInThreads: false, CreatePublicThreads: false }, { reason: `${interaction.user.tag}: ${reason ?? t('common.noReason')}` });
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })), true);
            return;
        }
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.locked', { channel: `<#${channel.id}>` })));
        if (reason) {
            await channel
                .send({ embeds: [(0, embeds_1.warningEmbed)(`🔒 ${reason}`)] })
                .catch(() => null);
        }
    },
});
//# sourceMappingURL=lock.js.map