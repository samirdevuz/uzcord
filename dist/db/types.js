"use strict";
/**
 * Baza jadvallarining TypeScript ko'rinishi.
 *
 * Eslatma: Postgres da timestamptz ishlatiladi, lekin bot ichida vaqtlar
 * millisekund (number) sifatida yuritiladi — shuning uchun o'qishda
 * `toMs()` orqali aylantiriladi.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOGGLE_FEATURES = exports.MODULE_NAMES = exports.LOG_COLUMNS = void 0;
exports.LOG_COLUMNS = {
    mod: 'mod_log_channel_id',
    message: 'message_log_channel_id',
    member: 'member_log_channel_id',
    server: 'server_log_channel_id',
    voice: 'voice_log_channel_id',
};
exports.MODULE_NAMES = [
    'moderation',
    'automod',
    'logging',
    'welcome',
    'roles',
    'leveling',
    'tickets',
    'starboard',
];
exports.TOGGLE_FEATURES = [
    'anti_spam',
    'anti_duplicate',
    'anti_invite',
    'anti_link',
    'anti_mention',
    'anti_caps',
    'anti_emoji',
    'word_filter',
    'anti_raid',
];
//# sourceMappingURL=types.js.map