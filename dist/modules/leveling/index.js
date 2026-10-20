"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachedLevelSettings = cachedLevelSettings;
exports.invalidateLevelSettings = invalidateLevelSettings;
exports.isLevelingActive = isLevelingActive;
exports.renderLevelUp = renderLevelUp;
exports.awardMessageXp = awardMessageXp;
exports.progressBar = progressBar;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const leveling_1 = require("../../db/leveling");
const guilds_1 = require("../../db/guilds");
const i18n_1 = require("../../i18n");
const permissions_1 = require("../../utils/permissions");
const log = (0, logger_1.createLogger)('leveling');
/**
 * Sozlamalar har bir xabarda kerak — bazaga har safar so'rov yubormaslik
 * uchun qisqa muddat keshlanadi. Dashboard yoki /level orqali o'zgarganda
 * `invalidateLevelSettings()` keshni darhol tozalaydi.
 */
const SETTINGS_TTL = 60_000;
const settingsCache = new Map();
/** guildId:userId -> oxirgi marta XP berilgan vaqt */
const lastAward = new Map();
setInterval(() => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [key, at] of lastAward)
        if (at < cutoff)
            lastAward.delete(key);
}, 10 * 60 * 1000).unref();
async function cachedLevelSettings(guildId) {
    const hit = settingsCache.get(guildId);
    if (hit && Date.now() - hit.at < SETTINGS_TTL)
        return hit.value;
    const value = await (0, leveling_1.getLevelSettings)(guildId);
    settingsCache.set(guildId, { value, at: Date.now() });
    return value;
}
function invalidateLevelSettings(guildId) {
    settingsCache.delete(guildId);
}
/** Leveling haqiqatan ishlayaptimi: level_settings.enabled va modul o'chirilmagan. */
async function isLevelingActive(guildId) {
    if (!(0, guilds_1.isModuleEnabled)((0, guilds_1.getSettings)(guildId), 'leveling'))
        return false;
    return (await cachedLevelSettings(guildId)).enabled;
}
function randomBetween(min, max) {
    const low = Math.max(1, Math.min(min, max));
    const high = Math.max(low, max);
    return low + Math.floor(Math.random() * (high - low + 1));
}
function renderLevelUp(template, member, level) {
    return template
        .replace(/\{user\}/g, `<@${member.id}>`)
        .replace(/\{user\.name\}/g, member.displayName)
        .replace(/\{level\}/g, String(level))
        .replace(/\{server\}/g, member.guild.name);
}
/** Yangi darajaga yetganda mukofot rollarini beradi. Berilgan rollarni qaytaradi. */
async function applyRewards(member, level, stack) {
    const rewards = await (0, leveling_1.getLevelRewards)(member.guild.id);
    const earned = rewards.filter((reward) => reward.level <= level);
    if (earned.length === 0)
        return [];
    const me = member.guild.members.me;
    if (!me?.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles))
        return [];
    // stack_rewards o'chiq bo'lsa faqat eng yuqori mukofot qoladi.
    const keep = stack ? earned : earned.slice(-1);
    const keepIds = new Set(keep.map((reward) => reward.role_id));
    const given = [];
    for (const reward of keep) {
        if (member.roles.cache.has(reward.role_id) || !(0, permissions_1.canManageRole)(me, reward.role_id))
            continue;
        await member.roles.add(reward.role_id, `Leveling: ${level}-daraja`).catch(() => null);
        if (reward.level === level)
            given.push(reward.role_id);
    }
    if (!stack) {
        for (const reward of earned) {
            if (keepIds.has(reward.role_id) || !member.roles.cache.has(reward.role_id))
                continue;
            if (!(0, permissions_1.canManageRole)(me, reward.role_id))
                continue;
            await member.roles.remove(reward.role_id, 'Leveling: yuqoriroq mukofot berildi').catch(() => null);
        }
    }
    return given;
}
/** Har bir oddiy xabar uchun chaqiriladi (AutoMod o'tkazib yuborgan xabarlar). */
async function awardMessageXp(message) {
    if (!message.inGuild() || message.author.bot || message.system)
        return;
    const member = message.member;
    if (!member)
        return;
    if (!(0, guilds_1.isModuleEnabled)((0, guilds_1.getSettings)(message.guildId), 'leveling'))
        return;
    const settings = await cachedLevelSettings(message.guildId);
    if (!settings.enabled)
        return;
    const channelId = message.channel.isThread() ? message.channel.parentId ?? message.channelId : message.channelId;
    if (settings.ignored_channels.includes(channelId))
        return;
    if (settings.no_xp_roles.some((roleId) => member.roles.cache.has(roleId)))
        return;
    const key = `${message.guildId}:${member.id}`;
    const now = Date.now();
    const last = lastAward.get(key) ?? 0;
    if (now - last < settings.cooldown_seconds * 1000)
        return;
    lastAward.set(key, now);
    const amount = Math.max(1, Math.round(randomBetween(settings.xp_min, settings.xp_max) * Number(settings.multiplier || 1)));
    const result = await (0, leveling_1.addXp)(message.guildId, member.id, member.user.tag, member.displayAvatarURL({ size: 128 }), amount);
    if (!result || result.level <= result.oldLevel)
        return;
    try {
        const given = await applyRewards(member, result.level, settings.stack_rewards);
        if (!settings.announce_enabled)
            return;
        const t = (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(message.guildId).locale);
        let text = renderLevelUp(settings.level_up_message || t('level.defaultLevelUp'), member, result.level);
        if (given.length > 0) {
            text += `\n${t('level.rewardGiven', { roles: given.map((id) => `<@&${id}>`).join(', ') })}`;
        }
        const target = settings.announce_channel_id
            ? await message.guild.channels.fetch(settings.announce_channel_id).catch(() => null)
            : message.channel;
        if (target && target.isTextBased() && 'send' in target) {
            await target.send({ content: text, allowedMentions: { users: [member.id], roles: [] } });
        }
    }
    catch (error) {
        log.warn(`Daraja e'lonini yuborib bo'lmadi (${message.guildId}):`, error);
    }
}
/** Matnli progress chizig'i: ▰▰▰▱▱▱ */
function progressBar(percent, size = 12) {
    const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * size);
    return '▰'.repeat(filled) + '▱'.repeat(size - filled);
}
//# sourceMappingURL=index.js.map