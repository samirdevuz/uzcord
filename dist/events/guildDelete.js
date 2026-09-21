"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logger_1 = require("../core/logger");
const guilds_1 = require("../db/guilds");
const log = (0, logger_1.createLogger)('guild');
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildDelete, async (client, guild) => {
    await (0, guilds_1.markBotLeft)(guild.id);
    // Ma'lumotlarni saqlab qolamiz: bot qayta qo'shilsa sozlamalar joyida bo'ladi.
    // Butunlay o'chirish kerak bo'lsa: purgeGuild(guild.id)
    log.info(`Serverdan chiqarildim: ${guild.name} (${guild.id})`);
    log.info(`Jami serverlar: ${client.guilds.cache.size}`);
});
//# sourceMappingURL=guildDelete.js.map