import { createLogger } from './logger';
import { getExpiredActions, removeTempAction } from '../db/cases';
import { recordCase } from '../modules/moderation/actions';
import { getSettings } from '../db/guilds';
import { createTranslator } from '../i18n';
import type { UzCordClient } from './client';
import { getDueGiveaways } from '../db/giveaways';
import { getDuePolls } from '../db/polls';
import { getDueReminders } from '../db/reminders';
import { finishGiveaway } from '../modules/giveaways';
import { finishPoll } from '../modules/polls';
import { deliverReminder } from '../modules/reminders';

const log = createLogger('scheduler');

const INTERVAL = 30_000; // har 30 soniyada tekshiriladi

/** Muddati tugagan vaqtinchalik jazolarni (tempban) bekor qiladi. */
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
      // Faqat qaytarib bo'lmaydigan xatolarda yozuvni o'chiramiz (ban yo'q / server yo'q / ruxsat yo'q).
      // Tarmoq yoki Discord'ning vaqtinchalik xatosida keyingi tsiklda qayta urinamiz.
      const code = (error as { code?: number }).code;
      const permanent = code === 10026 || code === 10004 || code === 50013;
      log.warn(`Vaqtinchalik jazoni bekor qilib bo'lmadi (#${action.id}, kod ${code ?? '-'}):`, error);
      if (permanent) await removeTempAction(action.id);
    }
  }
}

/** Muddati tugagan konkurslarni yakunlaydi. */
async function processGiveaways(client: UzCordClient): Promise<void> {
  for (const giveaway of await getDueGiveaways()) {
    await finishGiveaway(client, giveaway).catch((error) => log.warn(`Konkurs #${giveaway.id}:`, error));
  }
}

/** Muddati tugagan so'rovnomalarni yakunlaydi. */
async function processPolls(client: UzCordClient): Promise<void> {
  for (const poll of await getDuePolls()) {
    await finishPoll(client, poll).catch((error) => log.warn(`So'rovnoma #${poll.id}:`, error));
  }
}

/** Vaqti kelgan eslatmalarni yetkazadi. */
async function processReminders(client: UzCordClient): Promise<void> {
  for (const reminder of await getDueReminders()) {
    await deliverReminder(client, reminder);
  }
}

const TASKS: [string, (client: UzCordClient) => Promise<void>][] = [
  ['temp_actions', processExpired],
  ['giveaways', processGiveaways],
  ['polls', processPolls],
  ['reminders', processReminders],
];

let running = false;

/** Barcha vazifalar; biri xato bersa qolganlari baribir bajariladi. */
async function tick(client: UzCordClient): Promise<void> {
  if (running) return; // oldingi tsikl hali tugamagan
  running = true;
  try {
    for (const [name, task] of TASKS) {
      await task(client).catch((error) => log.warn(`${name} vazifasida xatolik:`, error));
    }
  } finally {
    running = false;
  }
}

export function startScheduler(client: UzCordClient): void {
  void tick(client);
  const timer = setInterval(() => void tick(client), INTERVAL);
  timer.unref();
  log.info(`Rejalashtiruvchi ishga tushdi (har ${INTERVAL / 1000}s): ${TASKS.map(([name]) => name).join(', ')}.`);
}
