"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Slash komandalarni Discord'ga yuklaydi.
 *
 *   npm run deploy         — dev rejimda (tsx orqali)
 *   npm run deploy:prod    — build qilingandan keyin
 *
 * .env dagi DEV_GUILD_ID to'ldirilgan bo'lsa, komandalar faqat o'sha serverga
 * yuklanadi va bir zumda ko'rinadi. Bo'sh bo'lsa — global yuklanadi
 * (Discord'da tarqalishi bir necha daqiqa vaqt olishi mumkin).
 */
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const logger_1 = require("./logger");
const client_1 = require("./client");
const registry_1 = require("./registry");
const log = (0, logger_1.createLogger)('deploy');
async function main() {
    const client = new client_1.UzCordClient();
    const commands = (0, registry_1.loadCommands)(client);
    const body = commands.map((command) => command.data.toJSON());
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.token);
    if (config_1.config.devGuildId) {
        await rest.put(discord_js_1.Routes.applicationGuildCommands(config_1.config.clientId, config_1.config.devGuildId), { body });
        log.info(`${body.length} ta komanda ${config_1.config.devGuildId} serveriga yuklandi.`);
    }
    else {
        await rest.put(discord_js_1.Routes.applicationCommands(config_1.config.clientId), { body });
        log.info(`${body.length} ta komanda global yuklandi.`);
    }
    for (const command of body) {
        log.info(`  /${command.name}`);
    }
}
main().catch((error) => {
    log.error('Komandalarni yuklashda xatolik:', error);
    process.exit(1);
});
//# sourceMappingURL=deploy.js.map