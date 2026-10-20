import { PermissionFlagsBits, type GuildMember, type Message } from 'discord.js';
import { getSettings } from '../../db/guilds';
import { createTranslator } from '../../i18n';
import { formatDuration } from '../../utils/time';

const PREFIX = '[AFK] ';

interface AfkState {
  reason: string;
  since: number;
  /** Nickname o'zgartirilgan bo'lsa — qaytarish uchun avvalgi nom. */
  previousNick: string | null | undefined;
}

/** guildId:userId -> holat. Xotirada saqlanadi (qayta ishga tushganda tozalanadi). */
const afk = new Map<string, AfkState>();

const key = (guildId: string, userId: string) => `${guildId}:${userId}`;

export async function setAfk(member: GuildMember, reason: string): Promise<void> {
  const state: AfkState = { reason, since: Date.now(), previousNick: undefined };
  const me = member.guild.members.me;
  const canRename =
    me?.permissions.has(PermissionFlagsBits.ManageNicknames) &&
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

async function clearAfk(member: GuildMember): Promise<AfkState | null> {
  const k = key(member.guild.id, member.id);
  const state = afk.get(k);
  if (!state) return null;
  afk.delete(k);
  if (state.previousNick !== undefined && member.displayName.startsWith(PREFIX)) {
    await member.setNickname(state.previousNick, 'AFK tugadi').catch(() => null);
  }
  return state;
}

/** Har bir xabarda: muallif AFK bo'lsa holatni olib tashlaydi, AFK a'zolar eslatilsa xabar beradi. */
export async function handleAfkMessage(message: Message): Promise<void> {
  if (!message.inGuild() || message.author.bot || !message.member) return;
  const t = createTranslator(getSettings(message.guildId).locale);

  const back = await clearAfk(message.member);
  if (back) {
    const notice = await message
      .reply({ content: t('afk.back', { user: message.member.displayName, duration: formatDuration(Date.now() - back.since) }) })
      .catch(() => null);
    if (notice) setTimeout(() => void notice.delete().catch(() => null), 8000).unref();
  }

  const notes: string[] = [];
  for (const user of message.mentions.users.values()) {
    if (user.bot || user.id === message.author.id) continue;
    const state = afk.get(key(message.guildId, user.id));
    if (!state) continue;
    notes.push(t('afk.mention', { user: user.username, reason: state.reason, time: `<t:${Math.floor(state.since / 1000)}:R>` }));
  }
  if (notes.length > 0) {
    await message.reply({ content: notes.slice(0, 5).join('\n'), allowedMentions: { parse: [] } }).catch(() => null);
  }
}
