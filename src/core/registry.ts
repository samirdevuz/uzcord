import fs from 'node:fs';
import path from 'node:path';
import type { UzCordClient } from './client';
import type { BotEvent, Command } from './types';
import { createLogger } from './logger';

const log = createLogger('registry');

/** Papkani rekursiv aylanib, barcha .ts/.js fayllarni topadi. */
function walk(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

function loadModule<T>(file: string): T | null {
  try {
    const imported = require(file) as { default?: T } & T;
    return (imported.default ?? imported) as T;
  } catch (error) {
    log.error(`Fayl yuklanmadi (${path.basename(file)}):`, error);
    return null;
  }
}

/** src/commands (yoki dist/commands) ichidagi barcha komandalarni yuklaydi. */
export function loadCommands(client: UzCordClient): Command[] {
  const directory = path.join(__dirname, '..', 'commands');
  const commands: Command[] = [];

  for (const file of walk(directory)) {
    const command = loadModule<Command>(file);
    if (!command || !command.data || typeof command.execute !== 'function') {
      log.error(`Noto'g'ri komanda strukturasi faylda: ${path.basename(file)}`);
      continue;
    }

    const commandName = command.data.name;
    if (client.commands.has(commandName)) {
      log.error(`DUPLICATE COMMAND DETECTED: /${commandName} (${path.basename(file)} faylida). O'tkazib yuborildi.`);
      continue;
    }

    client.commands.set(commandName, command);
    commands.push(command);
  }

  log.info(`${commands.length} ta komanda muvaffaqiyatli yuklandi.`);
  return commands;
}

/** src/events (yoki dist/events) ichidagi barcha event handlerlarni ulaydi. */
export function loadEvents(client: UzCordClient): void {
  const directory = path.join(__dirname, '..', 'events');
  let count = 0;

  for (const file of walk(directory)) {
    const event = loadModule<BotEvent>(file);
    if (!event || !event.name || typeof event.execute !== 'function') {
      log.error(`Noto'g'ri event strukturasi faylda: ${path.basename(file)}`);
      continue;
    }

    const handler = (...args: unknown[]) => {
      try {
        const result = event.execute(client, ...args);
        if (result instanceof Promise) {
          result.catch((error: unknown) =>
            log.error(`${String(event.name)} eventida xatolik:`, error)
          );
        }
      } catch (error) {
        log.error(`${String(event.name)} eventida xatolik:`, error);
      }
    };

    const emitter = client as unknown as {
      on(name: string, listener: (...args: unknown[]) => void): void;
      once(name: string, listener: (...args: unknown[]) => void): void;
    };

    if (event.once) emitter.once(event.name, handler);
    else emitter.on(event.name, handler);

    count += 1;
  }

  log.info(`${count} ta event ulandi.`);
}
