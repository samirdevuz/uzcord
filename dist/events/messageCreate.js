"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const engine_1 = require("../modules/automod/engine");
const afk_1 = require("../modules/afk");
const leveling_1 = require("../modules/leveling");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.MessageCreate, async (_client, message) => {
    // AutoMod birinchi: qoidabuzar xabar o'chiriladi va unga XP berilmaydi.
    const flagged = await (0, engine_1.inspectMessage)(message);
    if (flagged)
        return;
    await Promise.all([(0, afk_1.handleAfkMessage)(message), (0, leveling_1.awardMessageXp)(message)]);
});
//# sourceMappingURL=messageCreate.js.map