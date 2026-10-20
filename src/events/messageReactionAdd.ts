import { Events } from 'discord.js';
import { defineEvent } from '../core/types';
import { handleStarReaction } from '../modules/starboard';

export default defineEvent(Events.MessageReactionAdd, async (_client, reaction, user) => {
  if (user.bot) return;
  await handleStarReaction(reaction, user);
});
