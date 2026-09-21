"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const engine_1 = require("../modules/automod/engine");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.MessageCreate, async (_client, message) => {
    await (0, engine_1.inspectMessage)(message);
});
//# sourceMappingURL=messageCreate.js.map