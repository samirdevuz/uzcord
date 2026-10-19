"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("../core/config");
const logger_1 = require("../core/logger");
const client_1 = require("../core/client");
const registry_1 = require("../core/registry");
const log = (0, logger_1.createLogger)('verify-commands');
async function main() {
    const client = new client_1.UzCordClient();
    const localCommands = (0, registry_1.loadCommands)(client);
    const localNames = new Set(localCommands.map((c) => c.data.name));
    const isGuild = process.argv.includes('--guild') || Boolean(process.env.DISCORD_TEST_GUILD_ID);
    const targetGuildId = (process.env.DISCORD_TEST_GUILD_ID || config_1.config.devGuildId || '').trim();
    log.info(`Target Application ID: ${config_1.config.clientId}`);
    log.info(`Verification mode: ${isGuild ? 'GUILD' : 'GLOBAL'}`);
    if (isGuild) {
        if (!targetGuildId) {
            log.error('XATOLIK: Guild mode tanlangan, lekin guild ID ko\'rsatilmadi (DEV_GUILD_ID / DISCORD_TEST_GUILD_ID).');
            process.exit(1);
        }
        log.info(`Target Guild ID: ${targetGuildId}`);
    }
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.token);
    const route = isGuild && targetGuildId
        ? discord_js_1.Routes.applicationGuildCommands(config_1.config.clientId, targetGuildId)
        : discord_js_1.Routes.applicationCommands(config_1.config.clientId);
    log.info(`Discord API dan masofaviy komandalar olinmoqda...`);
    const remoteCommands = (await rest.get(route));
    const remoteNames = new Set(remoteCommands.map((c) => c.name));
    console.log('\n========================================');
    console.log(`LOKAL KOMANDALAR (${localCommands.length} ta):`);
    console.log('========================================');
    for (const cmd of localCommands) {
        const subcmds = (cmd.data.toJSON().options || [])
            .filter((o) => o.type === 1 || o.type === 2) // Subcommand or SubcommandGroup
            .map((o) => o.name);
        const subStr = subcmds.length > 0 ? ` [subcommands: ${subcmds.join(', ')}]` : '';
        console.log(`  • /${cmd.data.name}${subStr}`);
    }
    console.log('\n========================================');
    console.log(`REMOTA DISCORD API KOMANDALARI (${remoteCommands.length} ta):`);
    console.log('========================================');
    for (const remote of remoteCommands) {
        const subcmds = (remote.options || [])
            .filter((o) => o.type === 1 || o.type === 2)
            .map((o) => o.name);
        const subStr = subcmds.length > 0 ? ` [subcommands: ${subcmds.join(', ')}]` : '';
        console.log(`  • /${remote.name} (ID: ${remote.id})${subStr}`);
    }
    const localOnly = [...localNames].filter((name) => !remoteNames.has(name));
    const remoteOnly = [...remoteNames].filter((name) => !localNames.has(name));
    const matching = [...localNames].filter((name) => remoteNames.has(name));
    console.log('\n========================================');
    console.log('SOLISHTIRISH NATIJASI:');
    console.log('========================================');
    console.log(`MOS KELGAN: ${matching.length} ta`);
    console.log(`FAQAT LOKALDA BOR (${localOnly.length} ta):`, localOnly.length > 0 ? localOnly.join(', ') : 'yo\'q');
    console.log(`FAQAT DISCORD DA BOR (${remoteOnly.length} ta):`, remoteOnly.length > 0 ? remoteOnly.join(', ') : 'yo\'q');
    if (localOnly.length > 0 || remoteOnly.length > 0) {
        log.error('XATOLIK: Lokal va remote komandalar ro\'yxati mos kelmadi!');
        process.exit(1);
    }
    log.info('✅ MUVAFFAQIYATLI: Lokal va remote komandalar to\'liq mos keldi!');
}
main().catch((err) => {
    log.error('Tekshirishda xatolik:', err);
    process.exit(1);
});
//# sourceMappingURL=verifyCommands.js.map