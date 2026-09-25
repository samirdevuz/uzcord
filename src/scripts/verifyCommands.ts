import { REST, Routes, APIApplicationCommand } from 'discord.js';
import { config } from '../core/config';
import { createLogger } from '../core/logger';
import { UzCordClient } from '../core/client';
import { loadCommands } from '../core/registry';

const log = createLogger('verify-commands');

async function main(): Promise<void> {
  const client = new UzCordClient();
  const localCommands = loadCommands(client);
  const localNames = new Set(localCommands.map((c) => c.data.name));

  const isGuild = process.argv.includes('--guild') || Boolean(process.env.DISCORD_TEST_GUILD_ID);
  const targetGuildId = (process.env.DISCORD_TEST_GUILD_ID || config.devGuildId || '').trim();

  log.info(`Target Application ID: ${config.clientId}`);
  log.info(`Verification mode: ${isGuild ? 'GUILD' : 'GLOBAL'}`);
  if (isGuild) {
    if (!targetGuildId) {
      log.error('XATOLIK: Guild mode tanlangan, lekin guild ID ko\'rsatilmadi (DEV_GUILD_ID / DISCORD_TEST_GUILD_ID).');
      process.exit(1);
    }
    log.info(`Target Guild ID: ${targetGuildId}`);
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  const route = isGuild && targetGuildId
    ? Routes.applicationGuildCommands(config.clientId, targetGuildId)
    : Routes.applicationCommands(config.clientId);

  log.info(`Discord API dan masofaviy komandalar olinmoqda...`);
  const remoteCommands = (await rest.get(route)) as APIApplicationCommand[];
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
      .filter((o: any) => o.type === 1 || o.type === 2)
      .map((o: any) => o.name);
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
