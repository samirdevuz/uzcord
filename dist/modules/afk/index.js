"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAfk = setAfk;
exports.handleAfkMessage = handleAfkMessage;
const discord_js_1 = require("discord.js");
const guilds_1 = require("../../db/guilds");
const i18n_1 = require("../../i18n");
const time_1 = require("../../utils/time");
const PREFIX = '[AFK] ';
/** guildId:userId -> holat. Xotirada saqlanadi (qayta ishga tushganda tozalanadi). */
const afk = new Map();
const key = (guildId, userId) => `${guildId}:${userId}`;
async function setAfk(member, reason) {
    const state = { reason, since: Date.now(), previousNick: undefined };
    const me = member.guild.members.me;
    const canRename = me?.permissions.has(discord_js_1.PermissionFlagsBits.ManageNicknames) &&
        member.id !== member.guild.ownerId &&
        me.roles.highest.comparePositionTo(member.roles.highest) > 0;
    if (canRename && !member.displayName.startsWith(PREFIX)) {
        state.previousNick = member.nickname;
        await member.setNickname(`${PREFIX}${member.displayName}`.slice(0, 32), 'AFK').catch(() => {
            state.previousNick = undefined;
        });
    }
    afk.set(key(member.guild.id, member.id), state);
}
async function clearAfk(member) {
    const k = key(member.guild.id, member.id);
    const state = afk.get(k);
    if (!state)
        return null;
    afk.delete(k);
    if (state.previousNick !== undefined && member.displayName.startsWith(PREFIX)) {
        await member.setNickname(state.previousNick, 'AFK tugadi').catch(() => null);
    }
    return state;
}
/** Har bir xabarda: muallif AFK bo'lsa holatni olib tashlaydi, AFK a'zolar eslatilsa xabar beradi. */
async function handleAfkMessage(message) {
    if (!message.inGuild() || message.author.bot || !message.member)
        return;
    const t = (0, i18n_1.createTranslator)((0, guilds_1.getSettings)(message.guildId).locale);
    const back = await clearAfk(message.member);
    if (back) {
        const notice = await message
            .reply({ content: t('afk.back', { user: message.member.displayName, duration: (0, time_1.formatDuration)(Date.now() - back.since) }) })
            .catch(() => null);
        if (notice)
            setTimeout(() => void notice.delete().catch(() => null), 8000).unref();
    }
    const notes = [];
    for (const user of message.mentions.users.values()) {
        if (user.bot || user.id === message.author.id)
            continue;
        const state = afk.get(key(message.guildId, user.id));
        if (!state)
            continue;
        notes.push(t('afk.mention', { user: user.username, reason: state.reason, time: `<t:${Math.floor(state.since / 1000)}:R>` }));
    }
    if (notes.length > 0) {
        await message.reply({ content: notes.slice(0, 5).join('\n'), allowedMentions: { parse: [] } }).catch(() => null);
    }
}
//# sourceMappingURL=index.js.map