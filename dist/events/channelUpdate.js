"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const structure_1 = require("../modules/structure");
/** Dashboard'dagi kanal/rol ro'yxatini yangilab turadi. */
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.ChannelUpdate, (_client, _old, channel) => {
    const guild = 'guild' in channel ? channel.guild : null;
    if (guild)
        (0, structure_1.scheduleStructureSync)(guild);
});
//# sourceMappingURL=channelUpdate.js.map