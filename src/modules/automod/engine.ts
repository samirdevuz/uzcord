import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  type GuildMember,
  type Message,
  type TextChannel,
} from 'discord.js';
import { createLogger } from '../../core/logger';
import { getAutoMod, listWords, parseList, type AutoModSettings } from '../../db/automod';
import { addTempAction, countActiveWarnings } from '../../db/cases';
import { getSettings, isModuleEnabled } from '../../db/guilds';
import { recordCase } from '../moderation/actions';
import { applyEscalation } from '../moderation/escalation';
import { sendLog } from '../logging';
import { createTranslator, type TranslationKey, type Translator } from '../../i18n';
import { COLORS, truncate, warningEmbed } from '../../utils/embeds';
import { MAX_TIMEOUT } from '../../utils/time';
import {
  capsPercent,
  containsWord,
  countEmojis,
  extractDomains,
  INVITE_PATTERN,
  normalize,
} from './normalize';

const log = createLogger('automod');

interface Verdict {
  key: TranslationKey;
  detail?: string;
}

// ── Xotiradagi kuzatuvchilar (bazaga yozilmaydi) ───────────────────────────
const messageTimes = new Map<string, number[]>();
const lastContent = new Map<string, { text: string; count: number; at: number }>();
const recentJoins = new Map<string, number[]>();

/** Har 5 daqiqada eski yozuvlarni tozalash — xotira o'smasligi uchun. */
setInterval(
  () => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [key, times] of messageTimes) {
      const fresh = times.filter((time) => time > cutoff);
      if (fresh.length === 0) messageTimes.delete(key);
      else messageTimes.set(key, fresh);
    }
    for (const [key, value] of lastContent) {
      if (value.at < cutoff) lastContent.delete(key);
    }
    for (const [key, times] of recentJoins) {
      const fresh = times.filter((time) => time > cutoff);
      if (fresh.length === 0) recentJoins.delete(key);
      else recentJoins.set(key, fresh);
    }
  },
  5 * 60 * 1000
).unref();

/** Ushbu a'zo AutoMod tekshiruvidan ozod qilinganmi? */
function isExempt(member: GuildMember, message: Message, automod: AutoModSettings): boolean {
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) return true;

  const ignoredChannels = parseList(automod.ignored_channels);
  if (ignoredChannels.includes(message.channelId)) return true;
  if (message.channel.isThread() && message.channel.parentId) {
    if (ignoredChannels.includes(message.channel.parentId)) return true;
  }

  const ignoredRoles = parseList(automod.ignored_roles);
  if (ignoredRoles.some((roleId) => member.roles.cache.has(roleId))) return true;

  return false;
}

function checkRules(
  message: Message,
  member: GuildMember,
  automod: AutoModSettings
): Verdict | null {
  const content = message.content ?? '';
  const key = `${message.guildId}:${member.id}`;
  const nowMs = Date.now();

  // 1. Spam — qisqa vaqt ichida ko'p xabar
  if (automod.anti_spam) {
    const times = (messageTimes.get(key) ?? []).filter(
      (time) => nowMs - time < automod.spam_window_ms
    );
    times.push(nowMs);
    messageTimes.set(key, times);
    if (times.length > automod.spam_limit) {
      messageTimes.set(key, []);
      return { key: 'automod.spam' };
    }
  }

  // 2. Bir xil xabarni takrorlash
  if (automod.anti_duplicate && content.trim().length > 0) {
    const normalized = normalize(content);
    const previous = lastContent.get(key);
    if (previous && previous.text === normalized && nowMs - previous.at < 30_000) {
      previous.count += 1;
      previous.at = nowMs;
      if (previous.count >= 3) {
        lastContent.delete(key);
        return { key: 'automod.duplicate' };
      }
    } else {
      lastContent.set(key, { text: normalized, count: 1, at: nowMs });
    }
  }

  // 3. Discord taklif havolalari
  if (automod.anti_invite && INVITE_PATTERN.test(content)) {
    return { key: 'automod.invite' };
  }

  // 4. Ruxsat etilmagan havolalar
  if (automod.anti_link) {
    const allowed = parseList(automod.allowed_domains).map((domain) => domain.toLowerCase());
    const domains = extractDomains(content);
    const blocked = domains.find(
      (domain) => !allowed.some((item) => domain === item || domain.endsWith(`.${item}`))
    );
    if (blocked) return { key: 'automod.link', detail: blocked };
  }

  // 5. Haddan ortiq mention
  if (automod.anti_mention) {
    const mentions =
      message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
    if (mentions > automod.mention_limit) {
      return { key: 'automod.mention', detail: String(mentions) };
    }
  }

  // 6. KATTA HARFLAR
  if (automod.anti_caps) {
    const percent = capsPercent(content);
    if (percent >= automod.caps_percent) {
      return { key: 'automod.caps', detail: `${percent}%` };
    }
  }

  // 7. Emoji toshqini
  if (automod.anti_emoji) {
    const count = countEmojis(content);
    if (count > automod.emoji_limit) {
      return { key: 'automod.emoji', detail: String(count) };
    }
  }

  // 8. Taqiqlangan so'zlar
  if (automod.word_filter) {
    const words = listWords(message.guildId!);
    if (words.length > 0) {
      const found = containsWord(normalize(content), words);
      if (found) return { key: 'automod.word' };
    }
  }

  return null;
}

async function punish(
  message: Message,
  member: GuildMember,
  automod: AutoModSettings,
  verdict: Verdict,
  t: Translator
): Promise<void> {
  const guild = message.guild!;
  const reasonText = `AutoMod: ${t(verdict.key)}${verdict.detail ? ` (${verdict.detail})` : ''}`;
  const botId = guild.client.user!.id;

  if (automod.punishment === 'delete') return;

  if (automod.punishment === 'warn') {
    await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'warn',
        userId: member.id,
        userTag: member.user.tag,
        moderatorId: botId,
        moderatorTag: 'UzCord AutoMod',
        reason: reasonText,
      },
      t
    );
    const count = await countActiveWarnings(guild.id, member.id);
    await applyEscalation(guild, member, count, t, getSettings(guild.id));
    return;
  }

  const me = guild.members.me;
  if (!me || me.roles.highest.comparePositionTo(member.roles.highest) <= 0) return;

  if (automod.punishment === 'timeout') {
    const duration = Math.min(automod.punishment_ms, MAX_TIMEOUT);
    await member.timeout(duration, reasonText);
    await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'timeout',
        userId: member.id,
        userTag: member.user.tag,
        moderatorId: botId,
        moderatorTag: 'UzCord AutoMod',
        reason: reasonText,
        durationMs: duration,
      },
      t
    );
    return;
  }

  if (automod.punishment === 'kick') {
    await member.kick(reasonText);
    await recordCase(
      guild,
      {
        guildId: guild.id,
        type: 'kick',
        userId: member.id,
        userTag: member.user.tag,
        moderatorId: botId,
        moderatorTag: 'UzCord AutoMod',
        reason: reasonText,
      },
      t
    );
    return;
  }

  if (automod.punishment === 'ban') {
    const userTag = member.user.tag;
    const userId = member.id;
    const temporary = automod.punishment_ms > 0;
    await member.ban({ reason: reasonText });
    const modCase = await recordCase(
      guild,
      {
        guildId: guild.id,
        type: temporary ? 'tempban' : 'ban',
        userId,
        userTag,
        moderatorId: botId,
        moderatorTag: 'UzCord AutoMod',
        reason: reasonText,
        durationMs: temporary ? automod.punishment_ms : null,
      },
      t
    );
    if (temporary) {
      await addTempAction(
        guild.id,
        userId,
        'ban',
        Date.now() + automod.punishment_ms,
        modCase.case_number
      );
    }
  }
}

/** Har bir yangi xabar shu funksiyadan o'tadi. */
export async function inspectMessage(message: Message): Promise<void> {
  if (!message.inGuild()) return;
  if (message.author.bot || message.system) return;

  const member = message.member;
  if (!member) return;

  const settings = getSettings(message.guildId);
  if (!isModuleEnabled(settings, 'automod')) return;

  const automod = getAutoMod(message.guildId);
  if (!automod.enabled) return;
  if (isExempt(member, message, automod)) return;

  const verdict = checkRules(message, member, automod);
  if (!verdict) return;

  const t = createTranslator(settings.locale);

  try {
    if (message.deletable) await message.delete();
  } catch {
    // Xabar allaqachon o'chirilgan bo'lishi mumkin — e'tiborsiz qoldiramiz.
  }

  // Kanalga qisqa ogohlantirish (6 soniyadan keyin o'chadi).
  try {
    if (message.channel.type === ChannelType.GuildText) {
      const notice = await (message.channel as TextChannel).send({
        content: t('automod.notice', { user: `<@${member.id}>`, reason: t(verdict.key) }),
      });
      setTimeout(() => void notice.delete().catch(() => null), 6000);
    }
  } catch {
    // Kanalga yozish imkoni bo'lmasa — davom etamiz.
  }

  try {
    await punish(message, member, automod, verdict, t);
  } catch (error) {
    log.warn(`AutoMod jazosi bajarilmadi (${message.guildId}):`, error);
  }

  // Mod-log kanaliga yozib qo'yamiz.
  await sendLog(
    message.guild,
    'mod',
    new EmbedBuilder()
      .setColor(COLORS.purple)
      .setTitle(`🤖 ${t('automod.title')} — ${t(verdict.key)}`)
      .addFields(
        { name: t('common.user'), value: `<@${member.id}>\n\`${member.id}\``, inline: true },
        { name: t('common.channel'), value: `<#${message.channelId}>`, inline: true },
        {
          name: t('log.content'),
          value: truncate(message.content || t('log.empty')),
        }
      )
      .setTimestamp()
  );
}

/**
 * Yangi a'zo qo'shilganda chaqiriladi: reyd kuzatuvi va akkaunt yoshi tekshiruvi.
 * Agar a'zo chiqarilsa `true` qaytaradi.
 */
export async function inspectJoin(member: GuildMember): Promise<boolean> {
  const settings = getSettings(member.guild.id);
  if (!isModuleEnabled(settings, 'automod')) return false;

  const automod = getAutoMod(member.guild.id);
  if (!automod.enabled) return false;

  const t = createTranslator(settings.locale);
  const nowMs = Date.now();

  // Akkaunt yoshi tekshiruvi
  if (automod.min_account_age_days > 0) {
    const ageDays = (nowMs - member.user.createdTimestamp) / (24 * 60 * 60 * 1000);
    if (ageDays < automod.min_account_age_days) {
      const reason = t('automod.accountTooNew', { days: automod.min_account_age_days });
      try {
        await member.kick(reason);
        await recordCase(
          member.guild,
          {
            guildId: member.guild.id,
            type: 'kick',
            userId: member.id,
            userTag: member.user.tag,
            moderatorId: member.guild.client.user!.id,
            moderatorTag: 'UzCord AutoMod',
            reason,
          },
          t
        );
        return true;
      } catch (error) {
        log.warn('Yangi akkauntni chiqarib bo\'lmadi:', error);
      }
    }
  }

  // Reyd kuzatuvi
  if (automod.anti_raid) {
    const times = (recentJoins.get(member.guild.id) ?? []).filter(
      (time) => nowMs - time < automod.raid_window_ms
    );
    times.push(nowMs);
    recentJoins.set(member.guild.id, times);

    if (times.length >= automod.raid_join_limit) {
      recentJoins.set(member.guild.id, []);
      await sendLog(
        member.guild,
        'mod',
        warningEmbed(
          t('automod.raidAlert', {
            count: times.length,
            seconds: Math.round(automod.raid_window_ms / 1000),
          })
        ).setTitle(`🚨 ${t('automod.title')}`)
      );
    }
  }

  return false;
}
