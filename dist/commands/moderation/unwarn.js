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
        .setName('unwarn')
        .setDescription("Ogohlantirishni bekor qiladi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        .addSubcommand((sub) => sub
        .setName('case')
        .setDescription("Bitta ogohlantirishni case raqami bo'yicha bekor qiladi")
        .addIntegerOption((option) => option.setName('number').setDescription("Case raqami").setRequired(true).setMinValue(1)))
        .addSubcommand((sub) => sub
        .setName('all')
        .setDescription("Foydalanuvchining barcha ogohlantirishlarini tozalaydi")
        .addUserOption((option) => option.setName('user').setDescription("Foydalanuvchi").setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription("Sabab").setMaxLength(400))),
    async execute(interaction, ctx) {
        const { t } = ctx;
        const guild = interaction.guild;
        if (interaction.options.getSubcommand() === 'case') {
            const number = interaction.options.getInteger('number', true);
            const modCase = await (0, cases_1.getCase)(guild.id, number);
            if (!modCase || modCase.type !== 'warn') {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.caseNotFound', { case: number })), true);
                return;
            }
            if (!(await (0, cases_1.deactivateCase)(guild.id, number))) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.caseNotFound', { case: number })), true);
                return;
            }
            await interaction.deferReply();
            await (0, actions_1.recordCase)(guild, {
                guildId: guild.id,
                type: 'unwarn',
                userId: modCase.user_id,
                userTag: modCase.user_tag,
                moderatorId: interaction.user.id,
                moderatorTag: interaction.user.tag,
                reason: `Case #${number} bekor qilindi`,
            }, t);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.warnRemoved', { case: number })));
            return;
        }
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason');
        const count = await (0, cases_1.clearWarnings)(guild.id, user.id);
        if (count === 0) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.noWarnings', { user: user.tag })), true);
            return;
        }
        await interaction.deferReply();
        await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'unwarn',
            userId: user.id,
            userTag: user.tag,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason: reason ?? `${count} ta ogohlantirish tozalandi`,
        }, t);
        await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.warnsCleared', { user: user.tag, count })));
    },
});
//# sourceMappingURL=unwarn.js.map