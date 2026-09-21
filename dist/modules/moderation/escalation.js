"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyEscalation = applyEscalation;
const logger_1 = require("../../core/logger");
const guilds_1 = require("../../db/guilds");
const cases_1 = require("../../db/cases");
const actions_1 = require("./actions");
const time_1 = require("../../utils/time");
const log = (0, logger_1.createLogger)('escalation');
/**
 * Ogohlantirishlar soni belgilangan chegaraga yetganda avtomatik jazo qo'llaydi.
 * Qo'llangan jazo nomini (yoki topilmasa `null`) qaytaradi.
 */
async function applyEscalation(guild, member, warnCount, t, _settings) {
    const rules = await (0, guilds_1.getEscalations)(guild.id);
    const rule = rules.find((item) => item.warn_count === warnCount);
    if (!rule)
        return null;
    const me = guild.members.me;
    if (!me)
        return null;
    if (me.roles.highest.comparePositionTo(member.roles.highest) <= 0)
        return null;
    const reason = `Avtomatik: ${warnCount} ta ogohlantirish`;
    try {
        if (rule.action === 'timeout') {
            const duration = Math.min(rule.duration_ms ?? 60 * 60 * 1000, time_1.MAX_TIMEOUT);
            await member.timeout(duration, reason);
            await (0, actions_1.recordCase)(guild, {
                guildId: guild.id,
                type: 'timeout',
                userId: member.id,
                userTag: member.user.tag,
                moderatorId: guild.client.user.id,
                moderatorTag: 'UzCord (avtomatik)',
                reason,
                durationMs: duration,
            }, t);
            return 'timeout';
        }
        if (rule.action === 'kick') {
            await member.kick(reason);
            await (0, actions_1.recordCase)(guild, {
                guildId: guild.id,
                type: 'kick',
                userId: member.id,
                userTag: member.user.tag,
                moderatorId: guild.client.user.id,
                moderatorTag: 'UzCord (avtomatik)',
                reason,
            }, t);
            return 'kick';
        }
        if (rule.action === 'ban') {
            const userTag = member.user.tag;
            const userId = member.id;
            await member.ban({ reason });
            const modCase = await (0, actions_1.recordCase)(guild, {
                guildId: guild.id,
                type: rule.duration_ms ? 'tempban' : 'ban',
                userId,
                userTag,
                moderatorId: guild.client.user.id,
                moderatorTag: 'UzCord (avtomatik)',
                reason,
                durationMs: rule.duration_ms,
            }, t);
            if (rule.duration_ms) {
                await (0, cases_1.addTempAction)(guild.id, userId, 'ban', Date.now() + rule.duration_ms, modCase.case_number);
            }
            return 'ban';
        }
    }
    catch (error) {
        log.warn(`Eskalatsiya bajarilmadi (${guild.id}/${member.id}):`, error);
    }
    return null;
}
//# sourceMappingURL=escalation.js.map