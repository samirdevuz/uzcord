"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const logger_1 = require("./logger");
const cases_1 = require("../db/cases");
const actions_1 = require("../modules/moderation/actions");
const guilds_1 = require("../db/guilds");
const i18n_1 = require("../i18n");
const log = (0, logger_1.createLogger)('scheduler');
const INTERVAL = 30_000; // har 30 soniyada tekshiriladi
/** Muddati tugagan vaqtinchalik jazolarni bekor qiladi. */
async function processExpired(client) {
    const expired = await (0, cases_1.getExpiredActions)();
    if (expired.length === 0)
        return;
    for (const action of expired) {
        try {
            const guild = await client.guilds.fetch(action.guild_id).catch(() => null);
            if (!guild) {
                await (0, cases_1.removeTempAction)(action.id);
                continue;
            }
            if (action.type === 'ban') {
                const ban = await guild.bans.fetch(action.user_id).catch(() => null);
                if (ban) {
                    await guild.bans.remove(action.user_id, 'Vaqtinchalik ban muddati tugadi');
                    const settings = (0, guilds_1.getSettings)(guild.id);
                    const t = (0, i18n_1.createTranslator)(settings.locale);
                    await (0, actions_1.recordCase)(guild, {
                        guildId: guild.id,
                        type: 'unban',
                        userId: action.user_id,
                        userTag: ban.user.tag,
                        moderatorId: client.user.id,
                        moderatorTag: 'UzCord (avtomatik)',
                        reason: `Case #${action.case_number ?? '-'} muddati tugadi`,
                    }, t);
                    log.info(`Vaqtinchalik ban bekor qilindi: ${action.user_id} @ ${guild.id}`);
                }
            }
            await (0, cases_1.removeTempAction)(action.id);
        }
        catch (error) {
            log.warn(`Vaqtinchalik jazoni bekor qilib bo'lmadi (#${action.id}):`, error);
            await (0, cases_1.removeTempAction)(action.id);
        }
    }
}
function startScheduler(client) {
    void processExpired(client);
    const timer = setInterval(() => void processExpired(client), INTERVAL);
    timer.unref();
    log.info(`Rejalashtiruvchi ishga tushdi (har ${INTERVAL / 1000}s).`);
}
//# sourceMappingURL=scheduler.js.map