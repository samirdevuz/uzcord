import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { inspectMessage } from '../modules/automod/engine';
import { handleAfkMessage } from '../modules/afk';
import { awardMessageXp } from '../modules/leveling';

export default defineEvent(Events.MessageCreate, async (_client, message) => {
  // AutoMod birinchi: qoidabuzar xabar o'chiriladi va unga XP berilmaydi.
  const flagged = await inspectMessage(message);
  if (flagged) return;

  await Promise.all([handleAfkMessage(message), awardMessageXp(message)]);
});
