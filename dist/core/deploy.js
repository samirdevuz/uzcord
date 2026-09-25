"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const logger_1 = require("./logger");
const client_1 = require("./client");
const registry_1 = require("./registry");
const log = (0, logger_1.createLogger)('deploy');
async function main() {
    const client = new client_1.UzCordClient();
    const commands = (0, registry_1.loadCommands)(client);
    if (commands.length === 0) {
        log.error("CRITICAL: Hech qanday komanda topilmadi va yuklanmadi!");
        process.exit(1);
    }
    log.info(`--- YUKLANGAN KOMANDALAR RO'YXATI (${commands.length} ta) ---`);
    for (const cmd of commands) {
        log.info(`  ✓ /${cmd.data.name}`);
    }
    const body = commands.map((command) => command.data.toJSON());
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.token);
    const isGuildDeploy = process.argv.includes('--guild') || Boolean(process.env.DISCORD_TEST_GUILD_ID);
    const targetGuildId = process.env.DISCORD_TEST_GUILD_ID || config_1.config.devGuildId;
    if (isGuildDeploy && targetGuildId) {
        log.info(`Guild deploy rejimida: ${targetGuildId} serveriga yuklanmoqda...`);
        const deployed = await rest.put(discord_js_1.Routes.applicationGuildCommands(config_1.config.clientId, targetGuildId), { body });
        log.info(`Muvaffaqiyatli: ${deployed.length} ta komanda ${targetGuildId} serveriga yuklandi.`);
    }
    else {
        log.info('Global deploy rejimida yuklanmoqda...');
        const deployed = await rest.put(discord_js_1.Routes.applicationCommands(config_1.config.clientId), { body });
        log.info(`Muvaffaqiyatli: ${deployed.length} ta komanda global ro'yxatdan o'tkazildi.`);
    }
}
main().catch((error) => {
    log.error('Komandalarni yuklashda xatolik:', error);
    process.exit(1);
});
//# sourceMappingURL=deploy.js.map