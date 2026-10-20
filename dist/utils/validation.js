"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTagName = normalizeTagName;
exports.parseMessageReference = parseMessageReference;
/** Tag nomi: harf (har qanday alifbo), raqam, `-` va `_`; 1–32 belgi. */
const TAG_NAME = /^[\p{L}\p{N}_-]{1,32}$/u;
function normalizeTagName(input) {
    const name = input.trim().toLowerCase();
    return TAG_NAME.test(name) ? name : null;
}
/** Xabar havolasi (https://discord.com/channels/g/c/m) yoki ID dan qismlarni ajratadi. */
function parseMessageReference(input) {
    const trimmed = input.trim();
    const link = trimmed.match(/channels\/(?:\d+|@me)\/(\d+)\/(\d+)/);
    if (link)
        return { channelId: link[1], messageId: link[2] };
    if (/^\d{15,21}$/.test(trimmed))
        return { channelId: null, messageId: trimmed };
    return null;
}
//# sourceMappingURL=validation.js.map