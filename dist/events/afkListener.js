"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../core/types");
const afk_1 = require("../commands/utility/afk");
exports.default = (0, types_1.defineEvent)('messageCreate', async (client, message) => {
    if (!message.guild || message.author.bot)
        return;
    const userKey = `${message.guild.id}:${message.author.id}`;
    // If sender was AFK, remove AFK status
    if (afk_1.afkUsers.has(userKey)) {
        const afkInfo = afk_1.afkUsers.get(userKey);
        afk_1.afkUsers.delete(userKey);
        const durationMin = Math.round((Date.now() - afkInfo.timestamp) / 60_000);
        const reply = await message.reply(`Qaytishingiz bilan **${message.author.username}**! AFK holati olib tashlandi (${durationMin} daqiqa bo'ldingiz).`).catch(() => null);
        if (reply) {
            setTimeout(() => reply.delete().catch(() => null), 5000);
        }
    }
    // If mentioned user is AFK, notify sender
    if (message.mentions.users.size > 0) {
        for (const [id, user] of message.mentions.users) {
            if (user.bot || id === message.author.id)
                continue;
            const targetKey = `${message.guild.id}:${id}`;
            if (afk_1.afkUsers.has(targetKey)) {
                const info = afk_1.afkUsers.get(targetKey);
                await message.reply(`💤 **${user.username}** hozirda AFK: *${info.reason}*`).catch(() => null);
            }
        }
    }
});
//# sourceMappingURL=afkListener.js.map