import { Message } from 'discord.js';
import { defineEvent } from '../core/types';
import { afkUsers } from '../commands/utility/afk';

export default defineEvent('messageCreate', async (client, message: Message) => {
  if (!message.guild || message.author.bot) return;

  const userKey = `${message.guild.id}:${message.author.id}`;

  // If sender was AFK, remove AFK status
  if (afkUsers.has(userKey)) {
    const afkInfo = afkUsers.get(userKey)!;
    afkUsers.delete(userKey);
    const durationMin = Math.round((Date.now() - afkInfo.timestamp) / 60_000);

    const reply = await message.reply(`Qaytishingiz bilan **${message.author.username}**! AFK holati olib tashlandi (${durationMin} daqiqa bo'ldingiz).`).catch(() => null);
    if (reply) {
      setTimeout(() => reply.delete().catch(() => null), 5000);
    }
  }

  // If mentioned user is AFK, notify sender
  if (message.mentions.users.size > 0) {
    for (const [id, user] of message.mentions.users) {
      if (user.bot || id === message.author.id) continue;
      const targetKey = `${message.guild.id}:${id}`;
      if (afkUsers.has(targetKey)) {
        const info = afkUsers.get(targetKey)!;
        await message.reply(`💤 **${user.username}** hozirda AFK: *${info.reason}*`).catch(() => null);
      }
    }
  }
});
