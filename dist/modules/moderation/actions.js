"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTargetAllowed = ensureTargetAllowed;
exports.reply = reply;
exports.dmPunishment = dmPunishment;
exports.recordCase = recordCase;
exports.buildCaseEmbed = buildCaseEmbed;
exports.settingsFor = settingsFor;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const cases_1 = require("../../db/cases");
const guilds_1 = require("../../db/guilds");
const logging_1 = require("../logging");
const embeds_1 = require("../../utils/embeds");
const permissions_1 = require("../../utils/permissions");
const time_1 = require("../../utils/time");
const log = (0, logger_1.createLogger)('moderation');
/**
 * Moderator maqsadli a'zoga ta'sir qila oladimi? Yo'q bo'lsa,
 * foydalanuvchiga xatolik javobini o'zi yuboradi va `false` qaytaradi.
 */
async function ensureTargetAllowed(interaction, target, t) {
    const guild = interaction.guild;
    const me = guild.members.me;
    const executor = interaction.member;
    if (!me)
        return false;
    const verdict = (0, permissions_1.canTarget)(executor, target, me);
    if (verdict === 'ok')
        return true;
    await reply(interaction, (0, embeds_1.errorEmbed)(t(permissions_1.TARGET_ERROR_KEYS[verdict])));
    return false;
}
/** Interaction holatiga qarab to'g'ri javob metodini tanlaydi. */
async function reply(interaction, embed, ephemeral = false) {
    // Aniq tip berilmasa TypeScript MessageFlags.Ephemeral ni umumiy MessageFlags
    // ga kengaytirib yuboradi va discord.js tiplariga mos kelmay qoladi.
    const payload = { embeds: [embed] };
    if (ephemeral)
        payload.flags = discord_js_1.MessageFlags.Ephemeral;
    if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
    }
    else if (interaction.replied) {
        await interaction.followUp(payload);
    }
    else {
        await interaction.reply(payload);
    }
}
/** Jazolangan foydalanuvchiga shaxsiy xabar yuboradi (imkoni bo'lsa). */
async function dmPunishment(user, guild, type, reason, durationMs, t, settings) {
    if (!settings.dm_on_punish)
        return false;
    const key = {
        ban: 'dm.ban',
        tempban: 'dm.tempban',
        kick: 'dm.kick',
        timeout: 'dm.timeout',
        warn: 'dm.warn',
    }[type];
    if (!key)
        return false;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.CASE_COLORS[type] ?? 0x95a5a6)
        .setDescription(t(key, { guild: guild.name, duration: durationMs ? (0, time_1.formatDuration)(durationMs) : '' }))
        .addFields({ name: t('common.reason'), value: (0, embeds_1.truncate)(reason ?? t('common.noReason')) })
        .setFooter({ text: t('dm.footer') })
        .setTimestamp();
    try {
        await user.send({ embeds: [embed] });
        return true;
    }
    catch {
        // Foydalanuvchi shaxsiy xabarlarni yopgan — bu xatolik emas.
        return false;
    }
}
/**
 * Case yaratadi va uni mod-log kanaliga yozadi.
 *
 * Discord amali allaqachon bajarilgan bo'ladi, shuning uchun baza yozuvi
 * muvaffaqiyatsiz bo'lsa ham komanda to'xtamaydi — o'rniga case_number = 0
 * bo'lgan vaqtinchalik yozuv qaytariladi va xato logga tushadi.
 */
async function recordCase(guild, data, t) {
    const created = await (0, cases_1.createCase)(data);
    const modCase = created ?? {
        id: 0,
        guild_id: data.guildId,
        case_number: 0,
        type: data.type,
        user_id: data.userId,
        user_tag: data.userTag ?? null,
        moderator_id: data.moderatorId,
        moderator_tag: data.moderatorTag ?? null,
        reason: data.reason ?? null,
        duration_ms: data.durationMs ?? null,
        active: true,
        created_at: Date.now(),
    };
    if (!created) {
        log.error(`Case bazaga yozilmadi (${data.guildId}/${data.type}/${data.userId})`);
    }
    try {
        await (0, logging_1.sendLog)(guild, 'mod', buildCaseEmbed(modCase, t));
    }
    catch (error) {
        log.warn("Case logini yozib bo'lmadi:", error);
    }
    return modCase;
}
function buildCaseEmbed(modCase, t) {
    const emoji = embeds_1.CASE_EMOJI[modCase.type] ?? '📋';
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.CASE_COLORS[modCase.type] ?? 0x95a5a6)
        .setTitle(`${emoji} ${t('mod.caseTitle', { case: modCase.case_number, type: modCase.type })}`)
        .addFields({
        name: t('common.user'),
        value: `${modCase.user_tag ?? 'Noma\'lum'}\n<@${modCase.user_id}>\n\`${modCase.user_id}\``,
        inline: true,
    }, {
        name: t('common.moderator'),
        value: `${modCase.moderator_tag ?? 'Noma\'lum'}\n<@${modCase.moderator_id}>`,
        inline: true,
    })
        .setTimestamp(modCase.created_at);
    if (modCase.duration_ms) {
        embed.addFields({
            name: t('common.duration'),
            value: (0, time_1.formatDuration)(modCase.duration_ms),
            inline: true,
        });
    }
    embed.addFields({
        name: t('common.reason'),
        value: (0, embeds_1.truncate)(modCase.reason ?? t('common.noReason')),
    });
    return embed;
}
/** Komandalarda ishlatiladigan standart sozlama yuklagich. */
function settingsFor(guildId) {
    return (0, guilds_1.getSettings)(guildId);
}
//# sourceMappingURL=actions.js.map