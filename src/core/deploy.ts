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
import { REST, Routes } from 'discord.js';
import { config } from './config';
import { createLogger } from './logger';
import { UzCordClient } from './client';
import { loadCommands } from './registry';

const log = createLogger('deploy');

async function main(): Promise<void> {
  const client = new UzCordClient();
  const commands = loadCommands(client);
  const body = commands.map((command) => command.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.token);

  if (config.devGuildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.devGuildId), { body });
    log.info(`${body.length} ta komanda ${config.devGuildId} serveriga yuklandi.`);
  } else {
    await rest.put(Routes.applicationCommands(config.clientId), { body });
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
