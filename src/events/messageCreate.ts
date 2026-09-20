import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { inspectMessage } from '../modules/automod/engine';

export default defineEvent(Events.MessageCreate, async (_client, message) => {
  await inspectMessage(message);
});
