"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const help_1 = require("../../modules/help");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'utility',
    guildOnly: false,
    data: new discord_js_1.SlashCommandBuilder()
        .setName('help')
        .setDescription("Komandalar bo'yicha qo'llanma")
        .addStringOption((option) => option.setName('command').setDescription('Bitta komanda haqida batafsil').setAutocomplete(true)),
    async autocomplete(interaction, ctx) {
        const focused = interaction.options.getFocused().toLowerCase().replace(/^\//, '');
        const names = [...ctx.client.commands.keys()].filter((name) => name.includes(focused)).sort().slice(0, 25);
        await interaction.respond(names.map((name) => ({ name: `/${name}`, value: name })));
    },
    async execute(interaction, ctx) {
        const { t, client } = ctx;
        const requested = interaction.options.getString('command')?.toLowerCase().replace(/^\//, '');
        if (requested) {
            const command = client.commands.get(requested);
            if (!command) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('util.helpNotFound')), true);
                return;
            }
            await interaction.reply({ embeds: [(0, help_1.buildCommandDetail)(command, t)], flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.reply({ ...(0, help_1.buildHelpHome)(client, t), flags: discord_js_1.MessageFlags.Ephemeral });
    },
});
//# sourceMappingURL=help.js.map