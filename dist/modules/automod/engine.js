"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectMessage = inspectMessage;
exports.inspectJoin = inspectJoin;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../core/logger");
const automod_1 = require("../../db/automod");
const cases_1 = require("../../db/cases");
const guilds_1 = require("../../db/guilds");
const actions_1 = require("../moderation/actions");
const escalation_1 = require("../moderation/escalation");
const logging_1 = require("../logging");
const i18n_1 = require("../../i18n");
const embeds_1 = require("../../utils/embeds");
const time_1 = require("../../utils/time");
const normalize_1 = require("./normalize");
const log = (0, logger_1.createLogger)('automod');
// ── Xotiradagi kuzatuvchilar (bazaga yozilmaydi) ───────────────────────────
const messageTimes = new Map();
const lastContent = new Map();
const recentJoins = new Map();
/** Har 5 daqiqada eski yozuvlarni tozalash — xotira o'smasligi uchun. */
setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [key, times] of messageTimes) {
        const fresh = times.filter((time) => time > cutoff);
        if (fresh.length === 0)
            messageTimes.delete(key);
        else
            messageTimes.set(key, fresh);
    }
    for (const [key, value] of lastContent) {
        if (value.at < cutoff)
            lastContent.delete(key);
    }
    for (const [key, times] of recentJoins) {
        const fresh = times.filter((time) => time > cutoff);
        if (fresh.length === 0)
            recentJoins.delete(key);
        else
            recentJoins.set(key, fresh);
    }
}, 5 * 60 * 1000).unref();
/** Ushbu a'zo AutoMod tekshiruvidan ozod qilinganmi? */
function isExempt(member, message, automod) {
    if (member.permissions.has(discord_js_1.PermissionFlagsBits.ManageMessages))
        return true;
    if (member.permissions.has(discord_js_1.PermissionFlagsBits.ModerateMembers))
        return true;
    const ignoredChannels = (0, automod_1.parseList)(automod.ignored_channels);
    if (ignoredChannels.includes(message.channelId))
        return true;
    if (message.channel.isThread() && message.channel.parentId) {
        if (ignoredChannels.includes(message.channel.parentId))
            return true;
    }
    const ignoredRoles = (0, automod_1.parseList)(automod.ignored_roles);
    if (ignoredRoles.some((roleId) => member.roles.cache.has(roleId)))
        return true;
    return false;
}
function checkRules(message, member, automod) {
    const content = message.content ?? '';
    const key = `${message.guildId}:${member.id}`;
    const nowMs = Date.now();
    // 1. Spam — qisqa vaqt ichida ko'p xabar
    if (automod.anti_spam) {
        const times = (messageTimes.get(key) ?? []).filter((time) => nowMs - time < automod.spam_window_ms);
        times.push(nowMs);
        messageTimes.set(key, times);
        if (times.length > automod.spam_limit) {
            messageTimes.set(key, []);
            return { key: 'automod.spam' };
        }
    }
    // 2. Bir xil xabarni takrorlash
    if (automod.anti_duplicate && content.trim().length > 0) {
        const normalized = (0, normalize_1.normalize)(content);
        const previous = lastContent.get(key);
        if (previous && previous.text === normalized && nowMs - previous.at < 30_000) {
            previous.count += 1;
            previous.at = nowMs;
            if (previous.count >= 3) {
                lastContent.delete(key);
                return { key: 'automod.duplicate' };
            }
        }
        else {
            lastContent.set(key, { text: normalized, count: 1, at: nowMs });
        }
    }
    // 3. Discord taklif havolalari
    if (automod.anti_invite && normalize_1.INVITE_PATTERN.test(content)) {
        return { key: 'automod.invite' };
    }
    // 4. Ruxsat etilmagan havolalar
    if (automod.anti_link) {
        const allowed = (0, automod_1.parseList)(automod.allowed_domains).map((domain) => domain.toLowerCase());
        const domains = (0, normalize_1.extractDomains)(content);
        const blocked = domains.find((domain) => !allowed.some((item) => domain === item || domain.endsWith(`.${item}`)));
        if (blocked)
            return { key: 'automod.link', detail: blocked };
    }
    // 5. Haddan ortiq mention
    if (automod.anti_mention) {
        const mentions = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
        if (mentions > automod.mention_limit) {
            return { key: 'automod.mention', detail: String(mentions) };
        }
    }
    // 6. KATTA HARFLAR
    if (automod.anti_caps) {
        const percent = (0, normalize_1.capsPercent)(content);
        if (percent >= automod.caps_percent) {
            return { key: 'automod.caps', detail: `${percent}%` };
        }
    }
    // 7. Emoji toshqini
    if (automod.anti_emoji) {
        const count = (0, normalize_1.countEmojis)(content);
        if (count > automod.emoji_limit) {
            return { key: 'automod.emoji', detail: String(count) };
        }
    }
    // 8. Taqiqlangan so'zlar
    if (automod.word_filter) {
        const words = (0, automod_1.listWords)(message.guildId);
        if (words.length > 0) {
            const found = (0, normalize_1.containsWord)((0, normalize_1.normalize)(content), words);
            if (found)
                return { key: 'automod.word' };
        }
    }
    return null;
}
async function punish(message, member, automod, verdict, t) {
    const guild = message.guild;
    const reasonText = `AutoMod: ${t(verdict.key)}${verdict.detail ? ` (${verdict.detail})` : ''}`;
    const botId = guild.client.user.id;
    if (automod.punishment === 'delete')
        return;
    if (automod.punishment === 'warn') {
        await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'warn',
            userId: member.id,
            userTag: member.user.tag,
            moderatorId: botId,
            moderatorTag: 'UzCord AutoMod',
            reason: reasonText,
        }, t);
        const count = await (0, cases_1.countActiveWarnings)(guild.id, member.id);
        await (0, escalation_1.applyEscalation)(guild, member, count, t, (0, guilds_1.getSettings)(guild.id));
        return;
    }
    const me = guild.members.me;
    if (!me || me.roles.highest.comparePositionTo(member.roles.highest) <= 0)
        return;
    if (automod.punishment === 'timeout') {
        const duration = Math.min(automod.punishment_ms, time_1.MAX_TIMEOUT);
        await member.timeout(duration, reasonText);
        await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'timeout',
            userId: member.id,
            userTag: member.user.tag,
            moderatorId: botId,
            moderatorTag: 'UzCord AutoMod',
            reason: reasonText,
            durationMs: duration,
        }, t);
        return;
    }
    if (automod.punishment === 'kick') {
        await member.kick(reasonText);
        await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: 'kick',
            userId: member.id,
            userTag: member.user.tag,
            moderatorId: botId,
            moderatorTag: 'UzCord AutoMod',
            reason: reasonText,
        }, t);
        return;
    }
    if (automod.punishment === 'ban') {
        const userTag = member.user.tag;
        const userId = member.id;
        const temporary = automod.punishment_ms > 0;
        await member.ban({ reason: reasonText });
        const modCase = await (0, actions_1.recordCase)(guild, {
            guildId: guild.id,
            type: temporary ? 'tempban' : 'ban',
            userId,
            userTag,
            moderatorId: botId,
            moderatorTag: 'UzCord AutoMod',
            reason: reasonText,
            durationMs: temporary ? automod.punishment_ms : null,
        }, t);
        if (temporary) {
            await (0, cases_1.addTempAction)(guild.id, userId, 'ban', Date.now() + automod.punishment_ms, modCase.case_number);
        }
    }
}
/** Har bir yangi xabar shu funksiyadan o'tadi. */
async function inspectMessage(message) {
    if (!message.inGuild())
        return;
    if (message.author.bot || message.system)
        return;
    const member = message.member;
    if (!member)
        return;
    const settings = (0, guilds_1.getSettings)(message.guildId);
    if (!(0, guilds_1.isModuleEnabled)(settings, 'automod'))
        return;
    const automod = (0, automod_1.getAutoMod)(message.guildId);
    if (!automod.enabled)
        return;
    if (isExempt(member, message, automod))
        return;
    const verdict = checkRules(message, member, automod);
    if (!verdict)
        return;
    const t = (0, i18n_1.createTranslator)(settings.locale);
    try {
        if (message.deletable)
            await message.delete();
    }
    catch {
        // Xabar allaqachon o'chirilgan bo'lishi mumkin — e'tiborsiz qoldiramiz.
    }
    // Kanalga qisqa ogohlantirish (6 soniyadan keyin o'chadi).
    try {
        if (message.channel.type === discord_js_1.ChannelType.GuildText) {
            const notice = await message.channel.send({
                content: t('automod.notice', { user: `<@${member.id}>`, reason: t(verdict.key) }),
            });
            setTimeout(() => void notice.delete().catch(() => null), 6000);
        }
    }
    catch {
        // Kanalga yozish imkoni bo'lmasa — davom etamiz.
    }
    try {
        await punish(message, member, automod, verdict, t);
    }
    catch (error) {
        log.warn(`AutoMod jazosi bajarilmadi (${message.guildId}):`, error);
    }
    // Mod-log kanaliga yozib qo'yamiz.
    await (0, logging_1.sendLog)(message.guild, 'mod', new discord_js_1.EmbedBuilder()
        .setColor(embeds_1.COLORS.purple)
        .setTitle(`🤖 ${t('automod.title')} — ${t(verdict.key)}`)
        .addFields({ name: t('common.user'), value: `<@${member.id}>\n\`${member.id}\``, inline: true }, { name: t('common.channel'), value: `<#${message.channelId}>`, inline: true }, {
        name: t('log.content'),
        value: (0, embeds_1.truncate)(message.content || t('log.empty')),
    })
        .setTimestamp());
}
/**
 * Yangi a'zo qo'shilganda chaqiriladi: reyd kuzatuvi va akkaunt yoshi tekshiruvi.
 * Agar a'zo chiqarilsa `true` qaytaradi.
 */
async function inspectJoin(member) {
    const settings = (0, guilds_1.getSettings)(member.guild.id);
    if (!(0, guilds_1.isModuleEnabled)(settings, 'automod'))
        return false;
    const automod = (0, automod_1.getAutoMod)(member.guild.id);
    if (!automod.enabled)
        return false;
    const t = (0, i18n_1.createTranslator)(settings.locale);
    const nowMs = Date.now();
    // Akkaunt yoshi tekshiruvi
    if (automod.min_account_age_days > 0) {
        const ageDays = (nowMs - member.user.createdTimestamp) / (24 * 60 * 60 * 1000);
        if (ageDays < automod.min_account_age_days) {
            const reason = t('automod.accountTooNew', { days: automod.min_account_age_days });
            try {
                await member.kick(reason);
                await (0, actions_1.recordCase)(member.guild, {
                    guildId: member.guild.id,
                    type: 'kick',
                    userId: member.id,
                    userTag: member.user.tag,
                    moderatorId: member.guild.client.user.id,
                    moderatorTag: 'UzCord AutoMod',
                    reason,
                }, t);
                return true;
            }
            catch (error) {
                log.warn('Yangi akkauntni chiqarib bo\'lmadi:', error);
            }
        }
    }
    // Reyd kuzatuvi
    if (automod.anti_raid) {
        const times = (recentJoins.get(member.guild.id) ?? []).filter((time) => nowMs - time < automod.raid_window_ms);
        times.push(nowMs);
        recentJoins.set(member.guild.id, times);
        if (times.length >= automod.raid_join_limit) {
            recentJoins.set(member.guild.id, []);
            await (0, logging_1.sendLog)(member.guild, 'mod', (0, embeds_1.warningEmbed)(t('automod.raidAlert', {
                count: times.length,
                seconds: Math.round(automod.raid_window_ms / 1000),
            })).setTitle(`🚨 ${t('automod.title')}`));
        }
    }
    return false;
}
//# sourceMappingURL=engine.js.map