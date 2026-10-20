"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const logging_1 = require("../modules/logging");
const structure_1 = require("../modules/structure");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.ChannelDelete, async (_client, channel) => {
    if (!('guild' in channel) || !channel.guild)
        return;
    (0, structure_1.scheduleStructureSync)(channel.guild);
    await (0, logging_1.logStructureChange)(channel.guild, 'log.channelDeleted', { id: channel.id, name: channel.name });
});
//# sourceMappingURL=channelDelete.js.map