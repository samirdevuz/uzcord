import { REST, Routes } from 'discord.js';
import { config } from './config';
import { createLogger } from './logger';
import { UzCordClient } from './client';
import { loadCommands } from './registry';

const log = createLogger('deploy');

async function main(): Promise<void> {
  const client = new UzCordClient();
  const commands = loadCommands(client);

  if (commands.length === 0) {
    log.error("CRITICAL: Hech qanday komanda topilmadi va yuklanmadi!");
    process.exit(1);
  }

  log.info(`--- YUKLANGAN KOMANDALAR RO'YXATI (${commands.length} ta) ---`);
  for (const cmd of commands) {
    log.info(`  ✓ /${cmd.data.name}`);
  }

  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(config.token);

  const isGuildDeploy = process.argv.includes('--guild') || Boolean(process.env.DISCORD_TEST_GUILD_ID);
  const targetGuildId = process.env.DISCORD_TEST_GUILD_ID || config.devGuildId;

  if (isGuildDeploy && targetGuildId) {
    log.info(`Guild deploy rejimida: ${targetGuildId} serveriga yuklanmoqda...`);
    const deployed = await rest.put(
      Routes.applicationGuildCommands(config.clientId, targetGuildId),
      { body }
    ) as any[];
    log.info(`Muvaffaqiyatli: ${deployed.length} ta komanda ${targetGuildId} serveriga yuklandi.`);
  } else {
    log.info('Global deploy rejimida yuklanmoqda...');
    const deployed = await rest.put(
      Routes.applicationCommands(config.clientId),
      { body }
    ) as any[];
    log.info(`Muvaffaqiyatli: ${deployed.length} ta komanda global ro'yxatdan o'tkazildi.`);
  }
}

main().catch((error) => {
  log.error('Komandalarni yuklashda xatolik:', error);
  process.exit(1);
});
