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
        log.error("CRITICAL: Hech qanday lokal komanda topilmadi!");
        process.exit(1);
    }
    const isGuildDeploy = process.argv.includes('--guild') || Boolean(process.env.DISCORD_TEST_GUILD_ID);
    const targetGuildId = (process.env.DISCORD_TEST_GUILD_ID || config_1.config.devGuildId || '').trim();
    if (isGuildDeploy && !targetGuildId) {
        log.error("XATOLIK: Guild deploy rejimida (--guild) server IDsi (DISCORD_TEST_GUILD_ID yoki DEV_GUILD_ID) berilmagan!");
        log.error(".env faylida DEV_GUILD_ID=... yoki atribut sifatida DISCORD_TEST_GUILD_ID=... belgilang.");
        process.exit(1);
    }
    log.info(`Target application (Client ID): ${config_1.config.clientId}`);
    log.info(`Deployment mode: ${isGuildDeploy ? 'GUILD' : 'GLOBAL'}`);
    if (isGuildDeploy) {
        log.info(`Target guild ID: ${targetGuildId}`);
    }
    log.info(`--- LOKAL YUKLANGAN KOMANDALAR (${commands.length} ta) ---`);
    for (const cmd of commands) {
        log.info(`  ✓ /${cmd.data.name} [category: ${cmd.category}]`);
    }
    const body = commands.map((command) => command.data.toJSON());
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.token);
    if (isGuildDeploy) {
        log.info(`Discord API ga PUT yuborilmoqda: Routes.applicationGuildCommands(${config_1.config.clientId}, ${targetGuildId})...`);
        await rest.put(discord_js_1.Routes.applicationGuildCommands(config_1.config.clientId, targetGuildId), { body });
        log.info(`Discord API dan haqiqiy ro'yxatni olish (GET)...`);
        const remoteCommands = (await rest.get(discord_js_1.Routes.applicationGuildCommands(config_1.config.clientId, targetGuildId)));
        log.info(`--- DISCORD API QAYTARGAN GUILD KOMANDALARI (${remoteCommands.length} ta) ---`);
        for (const remote of remoteCommands) {
            const optionsInfo = remote.options
                ? ` (${remote.options.map((o) => o.name).join(', ')})`
                : '';
            log.info(`  • /${remote.name} [ID: ${remote.id}]${optionsInfo}`);
        }
        if (remoteCommands.length !== commands.length) {
            log.warn(`OGOHLANTIRISH: Lokal komandalar soni (${commands.length}) bilan Discord API qaytargan komandalar soni (${remoteCommands.length}) mos kelmadi!`);
        }
        else {
            log.info(`✅ TASHDIQLANDI: Barcha ${commands.length} ta komanda Discord API da saqlandi.`);
        }
    }
    else {
        log.info(`Discord API ga PUT yuborilmoqda: Routes.applicationCommands(${config_1.config.clientId})...`);
        await rest.put(discord_js_1.Routes.applicationCommands(config_1.config.clientId), { body });
        log.info(`Discord API dan haqiqiy global ro'yxatni olish (GET)...`);
        const remoteCommands = (await rest.get(discord_js_1.Routes.applicationCommands(config_1.config.clientId)));
        log.info(`--- DISCORD API QAYTARGAN GLOBAL KOMANDALARI (${remoteCommands.length} ta) ---`);
        for (const remote of remoteCommands) {
            const optionsInfo = remote.options
                ? ` (${remote.options.map((o) => o.name).join(', ')})`
                : '';
            log.info(`  • /${remote.name} [ID: ${remote.id}]${optionsInfo}`);
        }
        if (remoteCommands.length !== commands.length) {
            log.warn(`OGOHLANTIRISH: Lokal komandalar soni (${commands.length}) bilan Discord API qaytargan komandalar soni (${remoteCommands.length}) mos kelmadi!`);
        }
        else {
            log.info(`✅ TASHDIQLANDI: Barcha ${commands.length} ta komanda Discord API global ro'yxatida saqlandi.`);
        }
    }
}
main().catch((error) => {
    log.error('Komandalarni yuklashda xatolik:', error);
    process.exit(1);
});
//# sourceMappingURL=deploy.js.map