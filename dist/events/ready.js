"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logger_1 = require("../core/logger");
const guilds_1 = require("../db/guilds");
const scheduler_1 = require("../core/scheduler");
const embeds_1 = require("../utils/embeds");
const structure_1 = require("../modules/structure");
const log = (0, logger_1.createLogger)('ready');
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.ClientReady, async (client) => {
    log.info(`${client.user?.tag} tizimga kirdi.`);
    (0, embeds_1.setBrandIcon)(client.user?.displayAvatarURL({ size: 64 }));
    log.info(`Serverlar: ${client.guilds.cache.size} · Komandalar: ${client.commands.size}`);
    // Bot turgan har bir server uchun bazada yozuv borligiga ishonch hosil
    // qilamiz va dashboard uchun nom/ikonkani yangilaymiz.
    for (const guild of client.guilds.cache.values()) {
        await (0, guilds_1.ensureGuild)(guild.id, {
            name: guild.name,
            icon: guild.iconURL({ size: 128 }),
            memberCount: guild.memberCount,
        }).catch(() => null);
        await (0, structure_1.syncGuildStructure)(guild).catch(() => null);
    }
    client.user?.setPresence({
        status: 'online',
        activities: [{ name: "/help · uzcord.samirdev.uz", type: discord_js_1.ActivityType.Watching }],
    });
    (0, scheduler_1.startScheduler)(client);
}, true);
//# sourceMappingURL=ready.js.map