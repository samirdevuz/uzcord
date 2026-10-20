"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const guilds_1 = require("../db/guilds");
/** Server nomi yoki ikonkasi o'zgarsa, dashboard'dagi ma'lumotni yangilaydi. */
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildUpdate, async (_client, oldGuild, guild) => {
    if (oldGuild.name === guild.name && oldGuild.icon === guild.icon)
        return;
    await (0, guilds_1.ensureGuild)(guild.id, { name: guild.name, icon: guild.iconURL({ size: 128 }), memberCount: guild.memberCount });
});
//# sourceMappingURL=guildUpdate.js.map