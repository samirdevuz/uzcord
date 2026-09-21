"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../../core/types");
const cases_1 = require("../../db/cases");
const actions_1 = require("../../modules/moderation/actions");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
exports.default = (0, types_1.defineCommand)({
    category: 'moderation',
    botPermissions: [discord_js_1.PermissionFlagsBits.BanMembers],
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ban')
        .setDescription("Foydalanuvchini serverdan ban qiladi")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers)
        .setDMPermission(false)
        .addUserOption((option) => option.setName('user').setDescription("Ban qilinadigan foydalanuvchi").setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription("Ban sababi").setMaxLength(400))
        .addStringOption((option) => option
        .setName('duration')
        .setDescription("Vaqtinchalik ban muddati, masalan 7d yoki 12h (bo'sh = doimiy)"))
        .addIntegerOption((option) => option
        .setName('delete_messages')
        .setDescription("Oxirgi qancha vaqtdagi xabarlari o'chirilsin")
        .addChoices({ name: "O'chirilmasin", value: 0 }, { name: '1 soat', value: 3600 }, { name: '6 soat', value: 21600 }, { name: '1 kun', value: 86400 }, { name: '7 kun', value: 604800 })),
    async execute(interaction, ctx) {
        const { t, settings } = ctx;
        const guild = interaction.guild;
        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason');
        const durationInput = interaction.options.getString('duration');
        const deleteSeconds = interaction.options.getInteger('delete_messages') ?? 0;
        let durationMs = null;
        if (durationInput) {
            durationMs = (0, time_1.parseDuration)(durationInput);
            if (durationMs === null) {
                await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.invalidDuration')), true);
                return;
            }
        }
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (member && !(await (0, actions_1.ensureTargetAllowed)(interaction, member, t)))
            return;
        const existingBan = await guild.bans.fetch(user.id).catch(() => null);
        if (existingBan) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(`**${user.tag}** allaqachon ban qilingan.`), true);
            return;
        }
        await interaction.deferReply();
        const type = durationMs ? 'tempban' : 'ban';
        await (0, actions_1.dmPunishment)(user, guild, type, reason, durationMs, t, settings);
        try {
            await guild.bans.create(user.id, {
                reason: `${interaction.user.tag}: ${reason ?? t('common.noReason')}`,
                deleteMessageSeconds: deleteSeconds,
            });
        }
        catch (error) {
            await (0, actions_1.reply)(interaction, (0, embeds_1.errorEmbed)(t('error.actionFailed', { details: String(error) })));
            return;
        }
        const modCase = await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type,
            userId: user.id,
            userTag: user.tag,
            moderatorId: interaction.user.id,
            moderatorTag: interaction.user.tag,
            reason,
            durationMs,
        }, t);
        if (durationMs) {
            await (0, cases_1.addTempAction)(guild.id, user.id, 'ban', Date.now() + durationMs, modCase.case_number);
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.tempBanned', {
                user: user.tag,
                duration: (0, time_1.formatDuration)(durationMs),
                case: modCase.case_number,
            })));
        }
        else {
            await (0, actions_1.reply)(interaction, (0, embeds_1.successEmbed)(t('mod.banned', { user: user.tag, case: modCase.case_number })));
        }
    },
});
//# sourceMappingURL=ban.js.map