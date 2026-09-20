import { createLogger } from './logger';
import { getExpiredActions, removeTempAction } from '../db/cases';
import { recordCase } from '../modules/moderation/actions';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import type { UzCordClient } from './client';

const log = createLogger('scheduler');

const INTERVAL = 30_000; // har 30 soniyada tekshiriladi

/** Muddati tugagan vaqtinchalik jazolarni bekor qiladi. */
async function processExpired(client: UzCordClient): Promise<void> {
  const expired = await getExpiredActions();
  if (expired.length === 0) return;

  for (const action of expired) {
    try {
      const guild = await client.guilds.fetch(action.guild_id).catch(() => null);
      if (!guild) {
        await removeTempAction(action.id);
        continue;
      }

      if (action.type === 'ban') {
        const ban = await guild.bans.fetch(action.user_id).catch(() => null);
        if (ban) {
          await guild.bans.remove(action.user_id, 'Vaqtinchalik ban muddati tugadi');
          const settings = getSettings(guild.id);
          const t = createTranslator(settings.locale);
          await recordCase(
            guild,
            {
              guildId: guild.id,
              type: 'unban',
              userId: action.user_id,
              userTag: ban.user.tag,
              moderatorId: client.user!.id,
              moderatorTag: 'UzCord (avtomatik)',
              reason: `Case #${action.case_number ?? '-'} muddati tugadi`,
            },
            t
          );
          log.info(`Vaqtinchalik ban bekor qilindi: ${action.user_id} @ ${guild.id}`);
        }
      }

      await removeTempAction(action.id);
    } catch (error) {
      log.warn(`Vaqtinchalik jazoni bekor qilib bo'lmadi (#${action.id}):`, error);
      await removeTempAction(action.id);
    }
  }
}

export function startScheduler(client: UzCordClient): void {
  void processExpired(client);
  const timer = setInterval(() => void processExpired(client), INTERVAL);
  timer.unref();
  log.info(`Rejalashtiruvchi ishga tushdi (har ${INTERVAL / 1000}s).`);
}
