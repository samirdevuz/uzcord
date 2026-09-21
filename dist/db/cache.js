"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSettings = defaultSettings;
exports.defaultAutoMod = defaultAutoMod;
exports.mapGuild = mapGuild;
exports.mapAutoMod = mapAutoMod;
exports.cachedGuild = cachedGuild;
exports.putGuild = putGuild;
exports.cachedAutoMod = cachedAutoMod;
exports.putAutoMod = putAutoMod;
exports.cachedWords = cachedWords;
exports.putWords = putWords;
exports.allCachedGuilds = allCachedGuilds;
exports.hydrate = hydrate;
exports.startCacheRefresh = startCacheRefresh;
exports.stopCacheRefresh = stopCacheRefresh;
const config_1 = require("../core/config");
const logger_1 = require("../core/logger");
const supabase_1 = require("./supabase");
const log = (0, logger_1.createLogger)('cache');
/**
 * Issiq ma'lumotlar keshi.
 *
 * AutoMod har bir xabarda server sozlamalarini o'qiydi — agar har safar
 * Supabase ga so'rov ketsa, bot sezilarli sekinlashadi. Shuning uchun
 * server sozlamalari, AutoMod sozlamalari va taqiqlangan so'zlar
 * xotirada saqlanadi va davriy ravishda yangilanadi.
 *
 * Dashboard orqali kiritilgan o'zgarish botga eng ko'pi bilan
 * CACHE_REFRESH_MS ichida yetib boradi.
 */
const guildCache = new Map();
const autoModCache = new Map();
const wordCache = new Map();
let refreshTimer = null;
// ── Standart qiymatlar (baza defaultlari bilan bir xil) ────────────────────
function defaultSettings(guildId = '0') {
    return {
        guild_id: guildId,
        name: null,
        icon: null,
        member_count: null,
        locale: config_1.config.defaultLocale,
        mod_log_channel_id: null,
        message_log_channel_id: null,
        member_log_channel_id: null,
        server_log_channel_id: null,
        voice_log_channel_id: null,
        welcome_channel_id: null,
        welcome_message: null,
        goodbye_channel_id: null,
        goodbye_message: null,
        autorole_id: null,
        dm_on_punish: true,
        modules: {},
        bot_present: true,
        created_at: Date.now(),
        updated_at: Date.now(),
    };
}
function defaultAutoMod(guildId = '0') {
    return {
        guild_id: guildId,
        enabled: false,
        anti_spam: true,
        spam_limit: 5,
        spam_window_ms: 5000,
        anti_duplicate: true,
        anti_invite: true,
        anti_link: false,
        anti_mention: true,
        mention_limit: 5,
        anti_caps: true,
        caps_percent: 70,
        anti_emoji: false,
        emoji_limit: 10,
        word_filter: true,
        anti_raid: true,
        raid_join_limit: 8,
        raid_window_ms: 15000,
        min_account_age_days: 0,
        punishment: 'warn',
        punishment_ms: 600000,
        ignored_channels: [],
        ignored_roles: [],
        allowed_domains: [],
    };
}
// ── Qatorlarni bot tiplariga aylantirish ──────────────────────────────────
function asList(value) {
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
function mapGuild(row) {
    const base = defaultSettings(String(row.guild_id));
    return {
        ...base,
        ...row,
        modules: row.modules && typeof row.modules === 'object'
            ? row.modules
            : {},
        created_at: (0, supabase_1.toMs)(row.created_at),
        updated_at: (0, supabase_1.toMs)(row.updated_at),
    };
}
function mapAutoMod(row) {
    const base = defaultAutoMod(String(row.guild_id));
    return {
        ...base,
        ...row,
        ignored_channels: asList(row.ignored_channels),
        ignored_roles: asList(row.ignored_roles),
        allowed_domains: asList(row.allowed_domains),
    };
}
// ── Keshga kirish ─────────────────────────────────────────────────────────
function cachedGuild(guildId) {
    return guildCache.get(guildId);
}
function putGuild(settings) {
    guildCache.set(settings.guild_id, settings);
}
function cachedAutoMod(guildId) {
    return autoModCache.get(guildId);
}
function putAutoMod(settings) {
    autoModCache.set(settings.guild_id, settings);
}
function cachedWords(guildId) {
    return wordCache.get(guildId) ?? [];
}
function putWords(guildId, list) {
    wordCache.set(guildId, list);
}
function allCachedGuilds() {
    return [...guildCache.values()];
}
// ── Yuklash va yangilash ──────────────────────────────────────────────────
/** Bazadagi hamma narsani keshga yuklaydi. */
async function hydrate() {
    const guildRows = (0, supabase_1.unwrapList)(await supabase_1.supabase.from('guilds').select('*'), 'guilds yuklash');
    guildCache.clear();
    for (const row of guildRows)
        putGuild(mapGuild(row));
    const autoModRows = (0, supabase_1.unwrapList)(await supabase_1.supabase.from('automod_settings').select('*'), 'automod_settings yuklash');
    autoModCache.clear();
    for (const row of autoModRows)
        putAutoMod(mapAutoMod(row));
    const wordRows = (0, supabase_1.unwrapList)(await supabase_1.supabase.from('filtered_words').select('guild_id, word'), 'filtered_words yuklash');
    wordCache.clear();
    for (const row of wordRows) {
        const list = wordCache.get(row.guild_id) ?? [];
        list.push(row.word);
        wordCache.set(row.guild_id, list);
    }
    log.debug(`Kesh yangilandi: ${guildCache.size} server, ${autoModCache.size} automod, ` +
        `${wordRows.length} so'z`);
}
/** Davriy yangilashni boshlaydi. */
function startCacheRefresh() {
    if (refreshTimer)
        return;
    refreshTimer = setInterval(() => {
        void hydrate().catch((error) => log.warn('Keshni yangilab bo\'lmadi:', error));
    }, config_1.config.cacheRefreshMs);
    refreshTimer.unref();
    log.info(`Kesh har ${config_1.config.cacheRefreshMs / 1000}s da yangilanadi.`);
}
function stopCacheRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}
//# sourceMappingURL=cache.js.map