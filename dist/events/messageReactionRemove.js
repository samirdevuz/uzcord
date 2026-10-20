"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const types_1 = require("../core/types");
const starboard_1 = require("../modules/starboard");
exports.default = (0, types_1.defineEvent)(discord_js_1.Events.MessageReactionRemove, async (_client, reaction, user) => {
    if (user.bot)
        return;
    await (0, starboard_1.handleStarReaction)(reaction, user);
});
//# sourceMappingURL=messageReactionRemove.js.map