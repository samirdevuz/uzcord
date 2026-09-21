"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const cases_1 = require("../../db/cases");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    data: new discord_js_1.SlashCommandBuilder()
        .setName('case')
        .setDescription("Moderatsiya case ini ko'rish yoki tahrirlash")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand((sub) => sub
        .setName('view')
        .setDescription("Case ma'lumotlarini ko'rsatadi")
        .addIntegerOption((option) => option.setName('number').setDescription("Case raqami").setRequired(true).setMinValue(1)))
        .addSubcommand((sub) => sub
        .setName('reason')
        .setDescription("Case sababini o'zgartiradi")
        .addIntegerOption((option) => option.setName('number').setDescription("Case raqami").setRequired(true).setMinValue(1))
        .addStringOption((option) => option.setName('text').setDescription("Yangi sabab").setRequired(true).setMaxLength(400))),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guildId = interaction.guildId;
        const number = interaction.options.getInteger('number', true);
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const modCase = await (0, cases_1.getCase)(guildId, number);
        if (!modCase) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.caseNotFound', { case: number })), true);
            return;
        }
        if (interaction.options.getSubcommand() === 'view') {
            await (0, actions_1.reply)(interaction, (0, actions_1.buildCaseEmbed)(modCase, t), true);
            return;
        }
        const text = interaction.options.getString('text', true);
        await (0, cases_1.updateCaseReason)(guildId, number, text);
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(`\`Case #${number}\` sababi yangilandi.`), true);
    },
});
//# sourceMappingURL=case.js.map