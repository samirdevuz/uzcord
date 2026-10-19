import { REST, Routes, APIApplicationCommand } from 'discord.js';
import { config } from './config';
import { createLogger } from './logger';
import { UzCordClient } from './client';
import { loadCommands } from './registry';

const log = createLogger('deploy');

async function main(): Promise<void> {
  const client = new UzCordClient();
  const commands = loadCommands(client);

  if (commands.length === 0) {
    log.error("CRITICAL: Hech qanday lokal komanda topilmadi!");
    process.exit(1);
  }

  const isGuildDeploy = process.argv.includes('--guild') || Boolean(process.env.DISCORD_TEST_GUILD_ID);
  const targetGuildId = (process.env.DISCORD_TEST_GUILD_ID || config.devGuildId || '').trim();

  if (isGuildDeploy && !targetGuildId) {
    log.error("XATOLIK: Guild deploy rejimida (--guild) server IDsi (DISCORD_TEST_GUILD_ID yoki DEV_GUILD_ID) berilmagan!");
    log.error(".env faylida DEV_GUILD_ID=... yoki atribut sifatida DISCORD_TEST_GUILD_ID=... belgilang.");
    process.exit(1);
  }

  log.info(`Target application (Client ID): ${config.clientId}`);
  log.info(`Deployment mode: ${isGuildDeploy ? 'GUILD' : 'GLOBAL'}`);
  if (isGuildDeploy) {
    log.info(`Target guild ID: ${targetGuildId}`);
  }

  log.info(`--- LOKAL YUKLANGAN KOMANDALAR (${commands.length} ta) ---`);
  for (const cmd of commands) {
    log.info(`  ✓ /${cmd.data.name} [category: ${cmd.category}]`);
  }

  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(config.token);

  if (isGuildDeploy) {
    log.info(`Discord API ga PUT yuborilmoqda: Routes.applicationGuildCommands(${config.clientId}, ${targetGuildId})...`);
    await rest.put(Routes.applicationGuildCommands(config.clientId, targetGuildId), { body });

    log.info(`Discord API dan haqiqiy ro'yxatni olish (GET)...`);
    const remoteCommands = (await rest.get(
      Routes.applicationGuildCommands(config.clientId, targetGuildId)
    )) as APIApplicationCommand[];

    log.info(`--- DISCORD API QAYTARGAN GUILD KOMANDALARI (${remoteCommands.length} ta) ---`);
    for (const remote of remoteCommands) {
      const optionsInfo = remote.options
        ? ` (${remote.options.map((o) => o.name).join(', ')})`
        : '';
      log.info(`  • /${remote.name} [ID: ${remote.id}]${optionsInfo}`);
    }

    if (remoteCommands.length !== commands.length) {
      log.warn(`OGOHLANTIRISH: Lokal komandalar soni (${commands.length}) bilan Discord API qaytargan komandalar soni (${remoteCommands.length}) mos kelmadi!`);
    } else {
      log.info(`✅ TASHDIQLANDI: Barcha ${commands.length} ta komanda Discord API da saqlandi.`);
    }
  } else {
    log.info(`Discord API ga PUT yuborilmoqda: Routes.applicationCommands(${config.clientId})...`);
    await rest.put(Routes.applicationCommands(config.clientId), { body });

    log.info(`Discord API dan haqiqiy global ro'yxatni olish (GET)...`);
    const remoteCommands = (await rest.get(
      Routes.applicationCommands(config.clientId)
    )) as APIApplicationCommand[];

    log.info(`--- DISCORD API QAYTARGAN GLOBAL KOMANDALARI (${remoteCommands.length} ta) ---`);
    for (const remote of remoteCommands) {
      const optionsInfo = remote.options
        ? ` (${remote.options.map((o) => o.name).join(', ')})`
        : '';
      log.info(`  • /${remote.name} [ID: ${remote.id}]${optionsInfo}`);
    }

    if (remoteCommands.length !== commands.length) {
      log.warn(`OGOHLANTIRISH: Lokal komandalar soni (${commands.length}) bilan Discord API qaytargan komandalar soni (${remoteCommands.length}) mos kelmadi!`);
    } else {
      log.info(`✅ TASHDIQLANDI: Barcha ${commands.length} ta komanda Discord API global ro'yxatida saqlandi.`);
    }
  }
}

main().catch((error) => {
  log.error('Komandalarni yuklashda xatolik:', error);
  process.exit(1);
});
