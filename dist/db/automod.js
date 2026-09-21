"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOGGLE_FEATURES = void 0;
exports.getAutoMod = getAutoMod;
exports.updateAutoMod = updateAutoMod;
exports.parseList = parseList;
exports.toggleInList = toggleInList;
exports.listWords = listWords;
exports.refreshWords = refreshWords;
exports.addWord = addWord;
exports.removeWord = removeWord;
const logger_1 = require("../core/logger");
const cache_1 = require("./cache");
const supabase_1 = require("./supabase");
var types_1 = require("./types");
Object.defineProperty(exports, "TOGGLE_FEATURES", { enumerable: true, get: function () { return types_1.TOGGLE_FEATURES; } });
const log = (0, logger_1.createLogger)('db:automod');
/** AutoMod sozlamalarini KESHDAN oladi — har bir xabarda chaqiriladi. */
function getAutoMod(guildId) {
    const cached = (0, cache_1.cachedAutoMod)(guildId);
    if (cached)
        return cached;
    const fallback = (0, cache_1.defaultAutoMod)(guildId);
    (0, cache_1.putAutoMod)(fallback);
    void ensureAutoMod(guildId);
    return fallback;
}
async function ensureAutoMod(guildId) {
    const row = (0, supabase_1.unwrap)(await supabase_1.supabase
        .from('automod_settings')
        .upsert({ guild_id: guildId }, { onConflict: 'guild_id' })
        .select()
        .single(), `ensureAutoMod(${guildId})`);
    if (!row)
        return getAutoMod(guildId);
    const settings = (0, cache_1.mapAutoMod)(row);
    (0, cache_1.putAutoMod)(settings);
    return settings;
}
async function updateAutoMod(guildId, patch) {
    const row = (0, supabase_1.unwrap)(await supabase_1.supabase
        .from('automod_settings')
        .upsert({ ...patch, guild_id: guildId }, { onConflict: 'guild_id' })
        .select()
        .single(), `updateAutoMod(${guildId})`);
    if (!row) {
        const merged = { ...getAutoMod(guildId), ...patch };
        (0, cache_1.putAutoMod)(merged);
        return merged;
    }
    const settings = (0, cache_1.mapAutoMod)(row);
    (0, cache_1.putAutoMod)(settings);
    return settings;
}
/**
 * Moslik uchun: ilgari ro'yxatlar JSON matn sifatida saqlanardi.
 * Endi ular jsonb (massiv) — bu funksiya ikkalasini ham qabul qiladi.
 */
function parseList(value) {
    if (Array.isArray(value))
        return value.map(String);
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        }
        catch {
            return [];
        }
    }
    return [];
}
/** Ro'yxatdagi elementni qo'shadi yoki olib tashlaydi. */
async function toggleInList(guildId, column, value) {
    const settings = getAutoMod(guildId);
    const list = parseList(settings[column]);
    const index = list.indexOf(value);
    let added;
    if (index === -1) {
        list.push(value);
        added = true;
    }
    else {
        list.splice(index, 1);
        added = false;
    }
    await updateAutoMod(guildId, { [column]: list });
    return { list, added };
}
// ── Taqiqlangan so'zlar ─────────────────────────────────────────────────────
/** Keshdan o'qiladi — AutoMod issiq yo'li. */
function listWords(guildId) {
    return (0, cache_1.cachedWords)(guildId);
}
async function refreshWords(guildId) {
    const rows = (0, supabase_1.unwrapList)(await supabase_1.supabase
        .from('filtered_words')
        .select('word')
        .eq('guild_id', guildId)
        .order('word', { ascending: true }), `refreshWords(${guildId})`);
    const list = rows.map((row) => row.word);
    (0, cache_1.putWords)(guildId, list);
    return list;
}
async function addWord(guildId, word) {
    const clean = word.trim().toLowerCase();
    if (!clean)
        return false;
    if (listWords(guildId).includes(clean))
        return false;
    const { error } = await supabase_1.supabase
        .from('filtered_words')
        .insert({ guild_id: guildId, word: clean });
    if (error) {
        // 23505 = unique violation (so'z allaqachon bor)
        if (!error.message.includes('duplicate'))
            log.error(`addWord: ${error.message}`);
        return false;
    }
    await refreshWords(guildId);
    return true;
}
async function removeWord(guildId, word) {
    const clean = word.trim().toLowerCase();
    const { data, error } = await supabase_1.supabase
        .from('filtered_words')
        .delete()
        .eq('guild_id', guildId)
        .eq('word', clean)
        .select('id');
    if (error) {
        log.error(`removeWord: ${error.message}`);
        return false;
    }
    await refreshWords(guildId);
    return (data?.length ?? 0) > 0;
}
//# sourceMappingURL=automod.js.map