"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const logger_1 = require("./logger");
const cases_1 = require("../db/cases");
const actions_1 = require("../modules/moderation/actions");
const guilds_1 = require("../db/guilds");
const i18n_1 = require("../i18n");
const giveaways_1 = require("../db/giveaways");
const polls_1 = require("../db/polls");
const reminders_1 = require("../db/reminders");
const giveaways_2 = require("../modules/giveaways");
const polls_2 = require("../modules/polls");
const reminders_2 = require("../modules/reminders");
const log = (0, logger_1.createLogger)('scheduler');
const INTERVAL = 30_000; // har 30 soniyada tekshiriladi
/** Muddati tugagan vaqtinchalik jazolarni (tempban) bekor qiladi. */
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
            // Faqat qaytarib bo'lmaydigan xatolarda yozuvni o'chiramiz (ban yo'q / server yo'q / ruxsat yo'q).
            // Tarmoq yoki Discord'ning vaqtinchalik xatosida keyingi tsiklda qayta urinamiz.
            const code = error.code;
            const permanent = code === 10026 || code === 10004 || code === 50013;
            log.warn(`Vaqtinchalik jazoni bekor qilib bo'lmadi (#${action.id}, kod ${code ?? '-'}):`, error);
            if (permanent)
                await (0, cases_1.removeTempAction)(action.id);
        }
    }
}
/** Muddati tugagan konkurslarni yakunlaydi. */
async function processGiveaways(client) {
    for (const giveaway of await (0, giveaways_1.getDueGiveaways)()) {
        await (0, giveaways_2.finishGiveaway)(client, giveaway).catch((error) => log.warn(`Konkurs #${giveaway.id}:`, error));
    }
}
/** Muddati tugagan so'rovnomalarni yakunlaydi. */
async function processPolls(client) {
    for (const poll of await (0, polls_1.getDuePolls)()) {
        await (0, polls_2.finishPoll)(client, poll).catch((error) => log.warn(`So'rovnoma #${poll.id}:`, error));
    }
}
/** Vaqti kelgan eslatmalarni yetkazadi. */
async function processReminders(client) {
    for (const reminder of await (0, reminders_1.getDueReminders)()) {
        await (0, reminders_2.deliverReminder)(client, reminder);
    }
}
const TASKS = [
    ['temp_actions', processExpired],
    ['giveaways', processGiveaways],
    ['polls', processPolls],
    ['reminders', processReminders],
];
let running = false;
/** Barcha vazifalar; biri xato bersa qolganlari baribir bajariladi. */
async function tick(client) {
    if (running)
        return; // oldingi tsikl hali tugamagan
    running = true;
    try {
        for (const [name, task] of TASKS) {
            await task(client).catch((error) => log.warn(`${name} vazifasida xatolik:`, error));
        }
    }
    finally {
        running = false;
    }
}
function startScheduler(client) {
    void tick(client);
    const timer = setInterval(() => void tick(client), INTERVAL);
    timer.unref();
    log.info(`Rejalashtiruvchi ishga tushdi (har ${INTERVAL / 1000}s): ${TASKS.map(([name]) => name).join(', ')}.`);
}
//# sourceMappingURL=scheduler.js.map