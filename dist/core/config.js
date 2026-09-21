"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
function required(name) {
    const value = process.env[name];
    if (!value || value.trim() === '') {
        throw new Error(`[config] .env faylida "${name}" qiymati topilmadi. ` +
            `.env.example faylini nusxalab .env yarating va to'ldiring.`);
    }
    return value.trim();
}
function optional(name, fallback) {
    const value = process.env[name];
    return value && value.trim() !== '' ? value.trim() : fallback;
}
function number(name, fallback) {
    const parsed = Number.parseInt(optional(name, String(fallback)), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function list(name) {
    return (process.env[name] ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
}
exports.config = {
    token: required('DISCORD_TOKEN'),
    clientId: required('CLIENT_ID'),
    devGuildId: process.env.DEV_GUILD_ID?.trim() || null,
    ownerIds: list('OWNER_IDS'),
    // Supabase — bot service_role kalitidan foydalanadi (RLS ni chetlab o'tadi)
    supabaseUrl: required('SUPABASE_URL'),
    supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    /** Issiq keshni qayta yuklash oralig'i (ms). Dashboard o'zgarishi shuncha vaqtda yetadi. */
    cacheRefreshMs: number('CACHE_REFRESH_MS', 60_000),
    defaultLocale: optional('DEFAULT_LOCALE', 'uz'),
    logLevel: optional('LOG_LEVEL', 'info'),
};
//# sourceMappingURL=config.js.map