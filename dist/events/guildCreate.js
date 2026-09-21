"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logger_1 = require("../core/logger");
const guilds_1 = require("../db/guilds");
const log = (0, logger_1.createLogger)('guild');
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildCreate, async (client, guild) => {
    await (0, guilds_1.ensureGuild)(guild.id, {
        name: guild.name,
        icon: guild.iconURL({ size: 128 }),
        memberCount: guild.memberCount,
    });
    log.info(`Yangi serverga qo'shildim: ${guild.name} (${guild.id}) — ${guild.memberCount} a'zo`);
    log.info(`Jami serverlar: ${client.guilds.cache.size}`);
});
//# sourceMappingURL=guildCreate.js.map