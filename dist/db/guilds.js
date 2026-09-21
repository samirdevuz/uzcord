"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_COLUMNS = exports.MODULE_NAMES = exports.defaultSettings = void 0;
exports.getSettings = getSettings;
exports.ensureGuild = ensureGuild;
exports.updateSettings = updateSettings;
exports.setLogChannel = setLogChannel;
exports.isModuleEnabled = isModuleEnabled;
exports.setModule = setModule;
exports.markBotLeft = markBotLeft;
exports.getEscalations = getEscalations;
exports.setEscalation = setEscalation;
exports.removeEscalation = removeEscalation;
const logger_1 = require("../core/logger");
const cache_1 = require("./cache");
const supabase_1 = require("./supabase");
const types_1 = require("./types");
Object.defineProperty(exports, "LOG_COLUMNS", { enumerable: true, get: function () { return types_1.LOG_COLUMNS; } });
var cache_2 = require("./cache");
Object.defineProperty(exports, "defaultSettings", { enumerable: true, get: function () { return cache_2.defaultSettings; } });
var types_2 = require("./types");
Object.defineProperty(exports, "MODULE_NAMES", { enumerable: true, get: function () { return types_2.MODULE_NAMES; } });
const log = (0, logger_1.createLogger)('db:guilds');
/**
 * Server sozlamalarini KESHDAN oladi — sinxron va tez.
 * Kesh bo'sh bo'lsa standart qiymatlar qaytadi va yozuv fonda yaratiladi.
 */
function getSettings(guildId) {
    const cached = (0, cache_1.cachedGuild)(guildId);
    if (cached)
        return cached;
    const fallback = (0, cache_1.defaultSettings)(guildId);
    (0, cache_1.putGuild)(fallback);
    void ensureGuild(guildId);
    return fallback;
}
/** Server yozuvi bazada borligiga ishonch hosil qiladi. */
async function ensureGuild(guildId, meta) {
    const payload = { guild_id: guildId, bot_present: true };
    if (meta?.name !== undefined)
        payload.name = meta.name;
    if (meta?.icon !== undefined)
        payload.icon = meta.icon;
    if (meta?.memberCount !== undefined)
        payload.member_count = meta.memberCount;
    const row = (0, supabase_1.unwrap)(await supabase_1.supabase.from('guilds').upsert(payload, { onConflict: 'guild_id' }).select().single(), `ensureGuild(${guildId})`);
    if (!row)
        return getSettings(guildId);
    const settings = (0, cache_1.mapGuild)(row);
    (0, cache_1.putGuild)(settings);
    return settings;
}
/** Sozlamalarni yangilaydi va keshni darhol yangilaydi. */
async function updateSettings(guildId, patch) {
    const payload = { ...patch, guild_id: guildId };
    delete payload.created_at;
    delete payload.updated_at;
    const row = (0, supabase_1.unwrap)(await supabase_1.supabase.from('guilds').upsert(payload, { onConflict: 'guild_id' }).select().single(), `updateSettings(${guildId})`);
    if (!row) {
        // Yozib bo'lmadi — keshni hech bo'lmasa mahalliy yangilaymiz.
        const merged = { ...getSettings(guildId), ...patch };
        (0, cache_1.putGuild)(merged);
        return merged;
    }
    const settings = (0, cache_1.mapGuild)(row);
    (0, cache_1.putGuild)(settings);
    return settings;
}
async function setLogChannel(guildId, kind, channelId) {
    await updateSettings(guildId, { [types_1.LOG_COLUMNS[kind]]: channelId });
}
/** Modul yoqilganmi? Standart holatda barcha modullar yoqiq. */
function isModuleEnabled(settings, name) {
    return settings.modules?.[name] !== false;
}
async function setModule(guildId, name, enabled) {
    const settings = getSettings(guildId);
    const modules = { ...(settings.modules ?? {}), [name]: enabled };
    await updateSettings(guildId, { modules });
}
/** Bot serverdan chiqarilganda belgilab qo'yadi (ma'lumotlar o'chirilmaydi). */
async function markBotLeft(guildId) {
    await updateSettings(guildId, { bot_present: false });
}
// ── Ogohlantirish eskalatsiyasi ─────────────────────────────────────────────
async function getEscalations(guildId) {
    return (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('escalations')
        .select('*')
        .eq('guild_id', guildId)
        .order('warn_count', { ascending: true }), `getEscalations(${guildId})`);
}
async function setEscalation(guildId, warnCount, action, durationMs) {
    await ensureGuild(guildId);
    const { error } = await supabase_1.supabase.from('escalations').upsert({ guild_id: guildId, warn_count: warnCount, action, duration_ms: durationMs }, { onConflict: 'guild_id,warn_count' });
    if (error)
        log.error(`setEscalation: ${error.message}`);
}
async function removeEscalation(guildId, warnCount) {
    const { error, count } = await supabase_1.supabase
        .from('escalations')
        .delete({ count: 'exact' })
        .eq('guild_id', guildId)
        .eq('warn_count', warnCount);
    if (error) {
        log.error(`removeEscalation: ${error.message}`);
        return false;
    }
    return (count ?? 0) > 0;
}
//# sourceMappingURL=guilds.js.map