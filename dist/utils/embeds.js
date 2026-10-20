"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CASE_EMOJI = exports.CASE_COLORS = exports.FOOTER_TEXT = exports.COLORS = void 0;
exports.setBrandIcon = setBrandIcon;
exports.brandFooter = brandFooter;
exports.successEmbed = successEmbed;
exports.errorEmbed = errorEmbed;
exports.warningEmbed = warningEmbed;
exports.infoEmbed = infoEmbed;
exports.brandEmbed = brandEmbed;
exports.truncate = truncate;
const discord_js_1 = require("discord.js");
/**
 * Ranglar O'zbekiston bayrog'i palitrasidan — dashboard bilan bir xil
 * (dashboard/tailwind.config.ts: brand, leaf, flag.red).
 */
exports.COLORS = {
    brand: 0x14a9c9, // bayroqdagi ko'k
    info: 0x14a9c9,
    success: 0x1eb53a, // bayroqdagi yashil
    warning: 0xf5a524,
    danger: 0xe5484d,
    neutral: 0x5c6b80,
    purple: 0x8b5cf6,
    gold: 0xf5c518,
    pink: 0xec4899,
    indigo: 0x6366f1,
};
exports.FOOTER_TEXT = 'UzCord';
/** Bot tizimga kirgach o'rnatiladi — footerlarda bot avatari ko'rinadi. */
let footerIcon;
function setBrandIcon(url) {
    footerIcon = url;
}
function brandFooter(text = exports.FOOTER_TEXT) {
    return { text, iconURL: footerIcon };
}
function base(color) {
    return new discord_js_1.EmbedBuilder().setColor(color).setTimestamp();
}
function successEmbed(description, title) {
    const embed = base(exports.COLORS.success).setDescription(`✅ ${description}`);
    if (title)
        embed.setTitle(title);
    return embed;
}
function errorEmbed(description, title) {
    const embed = base(exports.COLORS.danger).setDescription(`❌ ${description}`);
    if (title)
        embed.setTitle(title);
    return embed;
}
function warningEmbed(description, title) {
    const embed = base(exports.COLORS.warning).setDescription(`⚠️ ${description}`);
    if (title)
        embed.setTitle(title);
    return embed;
}
function infoEmbed(description, title) {
    const embed = base(exports.COLORS.info);
    if (description)
        embed.setDescription(description);
    if (title)
        embed.setTitle(title);
    return embed;
}
function brandEmbed(title, description) {
    const embed = base(exports.COLORS.brand).setFooter(brandFooter());
    if (title)
        embed.setTitle(title);
    if (description)
        embed.setDescription(description);
    return embed;
}
/** Har bir jazo turi uchun rang. */
exports.CASE_COLORS = {
    ban: exports.COLORS.danger,
    tempban: exports.COLORS.danger,
    unban: exports.COLORS.success,
    kick: exports.COLORS.warning,
    timeout: exports.COLORS.warning,
    untimeout: exports.COLORS.success,
    warn: exports.COLORS.warning,
    unwarn: exports.COLORS.success,
    automod: exports.COLORS.purple,
};
exports.CASE_EMOJI = {
    ban: '🔨',
    tempban: '⏳',
    unban: '🔓',
    kick: '👢',
    timeout: '🔇',
    untimeout: '🔊',
    warn: '⚠️',
    unwarn: '✅',
    automod: '🤖',
};
/** Uzun matnni embed chegaralariga moslaydi. */
function truncate(text, max = 1024) {
    if (text.length <= max)
        return text;
    return `${text.slice(0, max - 3)}...`;
}
//# sourceMappingURL=embeds.js.map