"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UzCordClient = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("./logger");
class UzCordClient extends discord_js_1.Client {
    commands = new discord_js_1.Collection();
    /** commandName -> (userId -> keyingi ishlatish mumkin bo'lgan vaqt) */
    cooldowns = new discord_js_1.Collection();
    log = (0, logger_1.createLogger)('client');
    constructor() {
        super({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMembers, // privileged — portalda yoqilishi shart
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent, // privileged — automod uchun shart
                discord_js_1.GatewayIntentBits.GuildModeration,
                discord_js_1.GatewayIntentBits.GuildVoiceStates,
            ],
            partials: [
                discord_js_1.Partials.Message,
                discord_js_1.Partials.Channel,
                discord_js_1.Partials.GuildMember,
                discord_js_1.Partials.User,
            ],
            allowedMentions: { parse: ['users'], repliedUser: false },
            // Keraksiz keshlarni cheklash — xotirani tejaydi.
            makeCache: discord_js_1.Options.cacheWithLimits({
                ...discord_js_1.Options.DefaultMakeCacheSettings,
                MessageManager: 200,
                PresenceManager: 0,
                ReactionManager: 0,
            }),
        });
    }
}
exports.UzCordClient = UzCordClient;
//# sourceMappingURL=client.js.map