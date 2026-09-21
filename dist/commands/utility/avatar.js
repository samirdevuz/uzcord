"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    guildOnly: false,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('avatar')
        .setDescription("Foydalanuvchining avatarini ko'rsatadi")
        .addUserOption((option) => option.setName('user').setDescription("Foydalanuvchi (bo'sh = o'zingiz)")),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const user = interaction.options.getUser('user') ?? interaction.user;
        const url = user.displayAvatarURL({ size: 1024 });
        const embed = (0, embeds_1.brandEmbed)(t('util.avatarTitle', { user: user.tag }))
            .setImage(url)
            .setDescription(`[PNG](${user.displayAvatarURL({ extension: 'png', size: 1024 })}) · [WEBP](${user.displayAvatarURL({ extension: 'webp', size: 1024 })})`);
        await (0, actions_1.reply)(interaction, embed);
    },
});
//# sourceMappingURL=avatar.js.map