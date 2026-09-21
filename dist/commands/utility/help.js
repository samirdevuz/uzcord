"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const CATEGORY_ICONS = {
    moderation: '🛡️',
    config: '⚙️',
    utility: '🧰',
};
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    guildOnly: false,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('help')
        .setDescription("Barcha komandalar ro'yxatini ko'rsatadi")
        .addStringOption((option) => option.setName('command').setDescription("Bitta komanda haqida batafsil")),
    async execute(interaction, ctx) {
        const { t, client } = ctx;
        const requested = interaction.options.getString('command')?.toLowerCase().replace(/^\//, '');
        if (requested) {
            const command = client.commands.get(requested);
            if (!command) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('util.helpNotFound')), true);
                return;
            }
            const json = command.data.toJSON();
            const embed = (0, embeds_1.brandEmbed)(`/${json.name}`, json.description);
            const options = json.options ?? [];
            if (options.length > 0) {
                embed.addFields({
                    name: 'Parametrlar / sub-komandalar',
                    value: (0, embeds_1.truncate)(options.map((option) => `\`${option.name}\` — ${option.description}`).join('\n'), 1000),
                });
            }
            embed.addFields({
                name: 'Kategoriya',
                value: `${CATEGORY_ICONS[command.category]} ${command.category}`,
                inline: true,
            });
            await (0, actions_1.reply)(interaction, embed, true);
            return;
        }
        const embed = (0, embeds_1.brandEmbed)(t('util.helpTitle'), t('util.helpDescription'));
        const categories = ['moderation', 'config', 'utility'];
        const labels = {
            moderation: t('util.helpCategoryModeration'),
            config: t('util.helpCategoryConfig'),
            utility: t('util.helpCategoryUtility'),
        };
        for (const category of categories) {
            const names = client.commands
                .filter((command) => command.category === category)
                .map((command) => `\`/${command.data.name}\``)
                .sort();
            if (names.length === 0)
                continue;
            embed.addFields({
                name: `${CATEGORY_ICONS[category]} ${labels[category]} (${names.length})`,
                value: (0, embeds_1.truncate)(names.join(' '), 1000),
            });
        }
        await (0, actions_1.reply)(interaction, embed, true);
    },
});
//# sourceMappingURL=help.js.map