"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./core/config");
const logger_1 = require("./core/logger");
const client_1 = require("./core/client");
const registry_1 = require("./core/registry");
const db_1 = require("./db");
const log = (0, logger_1.createLogger)('main');
async function main() {
    log.info('UzCord ishga tushmoqda...');
    // Supabase ulanishi va kesh — botni login qilishdan OLDIN tayyorlanadi.
    await (0, db_1.initDatabase)();
    const client = new client_1.UzCordClient();
    (0, registry_1.loadCommands)(client);
    (0, registry_1.loadEvents)(client);
    // Kutilmagan xatoliklar botni o'chirib yubormasligi kerak.
    process.on('unhandledRejection', (reason) => log.error('Ushlanmagan promise xatosi:', reason));
    process.on('uncaughtException', (error) => log.error('Ushlanmagan xatolik:', error));
    const shutdown = (signal) => {
        log.info(`${signal} signali keldi — to'xtatilmoqda...`);
        client.destroy();
        (0, db_1.closeDatabase)();
        process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    await client.login(config_1.config.token);
}
main().catch((error) => {
    log.error('Botni ishga tushirib bo\'lmadi:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map