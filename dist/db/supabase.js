"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.unwrap = unwrap;
exports.unwrapList = unwrapList;
exports.toMs = toMs;
exports.toIso = toIso;
exports.checkConnection = checkConnection;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../core/config");
const logger_1 = require("../core/logger");
const log = (0, logger_1.createLogger)('supabase');
/**
 * Bot server tomonida ishlaydi, shuning uchun service_role kalitidan
 * foydalanadi — u RLS ni chetlab o'tadi. Bu kalit HECH QACHON
 * brauzerga yoki foydalanuvchiga ko'rinmasligi kerak.
 */
exports.supabase = (0, supabase_js_1.createClient)(config_1.config.supabaseUrl, config_1.config.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-client-info': 'uzcord-bot' } },
});
/** So'rov natijasini tekshiradi: xato bo'lsa logga yozib null qaytaradi. */
function unwrap(result, what) {
    if (result.error) {
        log.error(`${what} — ${result.error.message}`);
        return null;
    }
    return result.data;
}
/** Ro'yxat qaytaradigan so'rovlar uchun: xato bo'lsa bo'sh massiv. */
function unwrapList(result, what) {
    return unwrap(result, what) ?? [];
}
/** Postgres timestamptz (ISO matn) -> millisekund. */
function toMs(value) {
    return value ? new Date(value).getTime() : 0;
}
/** Millisekund -> Postgres timestamptz uchun ISO matn. */
function toIso(ms) {
    return new Date(ms).toISOString();
}
/** Ulanishni tekshiradi. Bot ishga tushganda bir marta chaqiriladi. */
async function checkConnection() {
    const { error } = await exports.supabase.from('guilds').select('guild_id').limit(1);
    if (error) {
        log.error(`Supabase ga ulanib bo'lmadi: ${error.message}`);
        return false;
    }
    log.info(`Supabase ulandi: ${config_1.config.supabaseUrl}`);
    return true;
}
//# sourceMappingURL=supabase.js.map