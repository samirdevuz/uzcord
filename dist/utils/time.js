"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_TIMEOUT = exports.WEEK = exports.DAY = exports.HOUR = exports.MINUTE = exports.SECOND = void 0;
exports.parseDuration = parseDuration;
exports.formatDuration = formatDuration;
exports.relative = relative;
exports.fullDate = fullDate;
exports.shortDate = shortDate;
exports.SECOND = 1000;
exports.MINUTE = 60 * exports.SECOND;
exports.HOUR = 60 * exports.MINUTE;
exports.DAY = 24 * exports.HOUR;
exports.WEEK = 7 * exports.DAY;
/** Discord timeout uchun maksimal muddat — 28 kun. */
exports.MAX_TIMEOUT = 28 * exports.DAY;
const UNITS = {
    s: exports.SECOND,
    m: exports.MINUTE,
    h: exports.HOUR,
    d: exports.DAY,
    w: exports.WEEK,
};
const PATTERN = /(\d+)\s*(s|m|h|d|w)/gi;
/**
 * "1h30m", "7d", "2 hafta" kabi matnni millisekundga aylantiradi.
 * Noto'g'ri format bo'lsa `null` qaytaradi.
 */
function parseDuration(input) {
    if (!input)
        return null;
    const normalized = input
        .toLowerCase()
        .replace(/soniya|sekund|sec/g, 's')
        .replace(/daqiqa|minut|min/g, 'm')
        .replace(/soat|hour/g, 'h')
        .replace(/kun|day/g, 'd')
        .replace(/hafta|week/g, 'w');
    let total = 0;
    let matched = false;
    PATTERN.lastIndex = 0;
    let match;
    while ((match = PATTERN.exec(normalized)) !== null) {
        const amount = Number.parseInt(match[1], 10);
        const unit = UNITS[match[2]];
        if (!Number.isFinite(amount) || !unit)
            continue;
        total += amount * unit;
        matched = true;
    }
    if (!matched || total <= 0)
        return null;
    return total;
}
const LABELS = [
    [exports.WEEK, 'hafta'],
    [exports.DAY, 'kun'],
    [exports.HOUR, 'soat'],
    [exports.MINUTE, 'daqiqa'],
    [exports.SECOND, 'soniya'],
];
/** Millisekundni o'qishga qulay ko'rinishga aylantiradi: "2 kun 3 soat". */
function formatDuration(ms, maxParts = 2) {
    if (!ms || ms <= 0)
        return '0 soniya';
    const parts = [];
    let remaining = ms;
    for (const [size, label] of LABELS) {
        if (remaining < size)
            continue;
        const amount = Math.floor(remaining / size);
        remaining -= amount * size;
        parts.push(`${amount} ${label}`);
        if (parts.length >= maxParts)
            break;
    }
    return parts.length > 0 ? parts.join(' ') : '1 soniyadan kam';
}
/** Discord uchun <t:...:R> ko'rinishidagi nisbiy vaqt. */
function relative(timestampMs) {
    return `<t:${Math.floor(timestampMs / 1000)}:R>`;
}
/** Discord uchun <t:...:f> ko'rinishidagi to'liq sana. */
function fullDate(timestampMs) {
    return `<t:${Math.floor(timestampMs / 1000)}:f>`;
}
function shortDate(timestampMs) {
    return `<t:${Math.floor(timestampMs / 1000)}:d>`;
}
//# sourceMappingURL=time.js.map