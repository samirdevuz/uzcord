"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logging_1 = require("../modules/logging");
const structure_1 = require("../modules/structure");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildRoleDelete, async (_client, role) => {
    (0, structure_1.scheduleStructureSync)(role.guild);
    await (0, logging_1.logStructureChange)(role.guild, 'log.roleDeleted', { id: role.id, name: role.name });
});
//# sourceMappingURL=roleDelete.js.map