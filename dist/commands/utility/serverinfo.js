"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription("Server haqida ma'lumot beradi")
        .setDMPermission(false),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        const owner = await guild.fetchOwner().catch(() => null);
        const channels = guild.channels.cache;
        const text = channels.filter((channel) => channel.type === discord_js_1.ChannelType.GuildText).size;
        const voice = channels.filter((channel) => channel.type === discord_js_1.ChannelType.GuildVoice).size;
        const categories = channels.filter((channel) => channel.type === discord_js_1.ChannelType.GuildCategory).size;
        const embed = (0, embeds_1.brandEmbed)(t('util.serverInfoTitle', { guild: guild.name }))
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields({ name: t('util.owner'), value: owner ? `<@${owner.id}>` : t('common.none'), inline: true }, { name: t('util.members'), value: String(guild.memberCount), inline: true }, { name: 'ID', value: `\`${guild.id}\``, inline: true }, {
            name: t('util.channels'),
            value: `💬 ${text} · 🔊 ${voice} · 📁 ${categories}`,
            inline: true,
        }, { name: t('util.roles'), value: String(guild.roles.cache.size - 1), inline: true }, { name: t('util.emojis'), value: String(guild.emojis.cache.size), inline: true }, {
            name: t('util.boosts'),
            value: `${guild.premiumSubscriptionCount ?? 0} (Level ${guild.premiumTier})`,
            inline: true,
        }, { name: t('util.createdAt'), value: (0, time_1.fullDate)(guild.createdTimestamp), inline: true });
        if (guild.bannerURL())
            embed.setImage(guild.bannerURL({ size: 1024 }));
        await (0, actions_1.reply)(interaction, embed);
    },
});
//# sourceMappingURL=serverinfo.js.map