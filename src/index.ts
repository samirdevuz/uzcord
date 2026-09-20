import { config } from './core/config';
import { createLogger } from './core/logger';
import { UzCordClient } from './core/client';
import { loadCommands, loadEvents } from './core/registry';
import { closeDatabase, initDatabase } from './db';

const log = createLogger('main');

async function main(): Promise<void> {
  log.info('UzCord ishga tushmoqda...');

  // Supabase ulanishi va kesh — botni login qilishdan OLDIN tayyorlanadi.
  await initDatabase();

  const client = new UzCordClient();
  loadCommands(client);
  loadEvents(client);

  // Kutilmagan xatoliklar botni o'chirib yubormasligi kerak.
  process.on('unhandledRejection', (reason) => log.error('Ushlanmagan promise xatosi:', reason));
  process.on('uncaughtException', (error) => log.error('Ushlanmagan xatolik:', error));

  const shutdown = (signal: string) => {
    log.info(`${signal} signali keldi — to'xtatilmoqda...`);
    client.destroy();
    closeDatabase();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await client.login(config.token);
}

main().catch((error) => {
  log.error('Botni ishga tushirib bo\'lmadi:', error);
  process.exit(1);
});
