import type { Guild, GuildMember } from 'discord.js';
import { createLogger } from '../../core/logger';
import { getEscalations, type GuildSettings } from '../../db/guilds';
import { addTempAction } from '../../db/cases';
import { recordCase } from './actions';
import { MAX_TIMEOUT } from '../../utils/time';
import type { Translator } from '../../i18n';

const log = createLogger('escalation');

/**
 * Ogohlantirishlar soni belgilangan chegaraga yetganda avtomatik jazo qo'llaydi.
 * Qo'llangan jazo nomini (yoki topilmasa `null`) qaytaradi.
 */
export async function applyEscalation(
  guild: Guild,
  member: GuildMember,
  warnCount: number,
  t: Translator,
  _settings: GuildSettings
): Promise<string | null> {
  const rules = await getEscalations(guild.id);
  const rule = rules.find((item) => item.warn_count === warnCount);
  if (!rule) return null;

  const me = guild.members.me;
  if (!me) return null;
  if (me.roles.highest.comparePositionTo(member.roles.highest) <= 0) return null;

  const reason = `Avtomatik: ${warnCount} ta ogohlantirish`;

  try {
    if (rule.action === 'timeout') {
      const duration = Math.min(rule.duration_ms ?? 60 * 60 * 1000, MAX_TIMEOUT);
      await member.timeout(duration, reason);
      await recordCase(
        guild,
        {
          guildId: guild.id,
          type: 'timeout',
          userId: member.id,
          userTag: member.user.tag,
          moderatorId: guild.client.user!.id,
          moderatorTag: 'UzCord (avtomatik)',
          reason,
          durationMs: duration,
        },
        t
      );
      return 'timeout';
    }

    if (rule.action === 'kick') {
      await member.kick(reason);
      await recordCase(
        guild,
        {
          guildId: guild.id,
          type: 'kick',
          userId: member.id,
          userTag: member.user.tag,
          moderatorId: guild.client.user!.id,
          moderatorTag: 'UzCord (avtomatik)',
          reason,
        },
        t
      );
      return 'kick';
    }

    if (rule.action === 'ban') {
      const userTag = member.user.tag;
      const userId = member.id;
      await member.ban({ reason });
      const modCase = await recordCase(
        guild,
        {
          guildId: guild.id,
          type: rule.duration_ms ? 'tempban' : 'ban',
          userId,
          userTag,
          moderatorId: guild.client.user!.id,
          moderatorTag: 'UzCord (avtomatik)',
          reason,
          durationMs: rule.duration_ms,
        },
        t
      );
      if (rule.duration_ms) {
        await addTempAction(guild.id, userId, 'ban', Date.now() + rule.duration_ms, modCase.case_number);
      }
      return 'ban';
    }
  } catch (error) {
    log.warn(`Eskalatsiya bajarilmadi (${guild.id}/${member.id}):`, error);
  }

  return null;
}
