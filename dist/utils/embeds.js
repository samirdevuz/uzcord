"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CASE_EMOJI = exports.CASE_COLORS = exports.FOOTER_TEXT = exports.COLORS = void 0;
exports.successEmbed = successEmbed;
exports.errorEmbed = errorEmbed;
exports.warningEmbed = warningEmbed;
exports.infoEmbed = infoEmbed;
exports.brandEmbed = brandEmbed;
exports.truncate = truncate;
const discord_js_1 = require("discord.js");
exports.COLORS = {
    brand: 0x1eb53a, // O'zbekiston bayrog'idagi yashil
    info: 0x0099ff,
    success: 0x2ecc71,
    warning: 0xf1c40f,
    danger: 0xe74c3c,
    neutral: 0x95a5a6,
    purple: 0x9b59b6,
};
exports.FOOTER_TEXT = 'UzCord';
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
    const embed = base(exports.COLORS.brand).setFooter({ text: exports.FOOTER_TEXT });
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