"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const structure_1 = require("../modules/structure");
/** Dashboard'dagi kanal/rol ro'yxatini yangilab turadi. */
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.GuildRoleUpdate, (_client, _old, role) => {
    const guild = role.guild;
    if (guild)
        (0, structure_1.scheduleStructureSync)(guild);
});
//# sourceMappingURL=roleUpdate.js.map