"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommands = loadCommands;
exports.loadEvents = loadEvents;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const logger_1 = require("./logger");
const log = (0, logger_1.createLogger)('registry');
/** Papkani rekursiv aylanib, barcha .ts/.js fayllarni topadi. */
function walk(directory) {
    if (!node_fs_1.default.existsSync(directory))
        return [];
    const results = [];
    for (const entry of node_fs_1.default.readdirSync(directory, { withFileTypes: true })) {
        const full = node_path_1.default.join(directory, entry.name);
        if (entry.isDirectory()) {
            results.push(...walk(full));
        }
        else if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
            results.push(full);
        }
    }
    return results;
}
function loadModule(file) {
    try {
        const imported = require(file);
        return (imported.default ?? imported);
    }
    catch (error) {
        log.error(`Fayl yuklanmadi (${node_path_1.default.basename(file)}):`, error);
        return null;
    }
}
/** src/commands (yoki dist/commands) ichidagi barcha komandalarni yuklaydi. */
function loadCommands(client) {
    const directory = node_path_1.default.join(__dirname, '..', 'commands');
    const commands = [];
    for (const file of walk(directory)) {
        const command = loadModule(file);
        if (!command || !command.data || typeof command.execute !== 'function') {
            log.error(`Noto'g'ri komanda strukturasi faylda: ${node_path_1.default.basename(file)}`);
            continue;
        }
        const commandName = command.data.name;
        if (client.commands.has(commandName)) {
            log.error(`DUPLICATE COMMAND DETECTED: /${commandName} (${node_path_1.default.basename(file)} faylida). O'tkazib yuborildi.`);
            continue;
        }
        client.commands.set(commandName, command);
        commands.push(command);
    }
    log.info(`${commands.length} ta komanda muvaffaqiyatli yuklandi.`);
    return commands;
}
/** src/events (yoki dist/events) ichidagi barcha event handlerlarni ulaydi. */
function loadEvents(client) {
    const directory = node_path_1.default.join(__dirname, '..', 'events');
    let count = 0;
    for (const file of walk(directory)) {
        const event = loadModule(file);
        if (!event || !event.name || typeof event.execute !== 'function') {
            log.error(`Noto'g'ri event strukturasi faylda: ${node_path_1.default.basename(file)}`);
            continue;
        }
        const handler = (...args) => {
            try {
                const result = event.execute(client, ...args);
                if (result instanceof Promise) {
                    result.catch((error) => log.error(`${String(event.name)} eventida xatolik:`, error));
                }
            }
            catch (error) {
                log.error(`${String(event.name)} eventida xatolik:`, error);
            }
        };
        const emitter = client;
        if (event.once)
            emitter.once(event.name, handler);
        else
            emitter.on(event.name, handler);
        count += 1;
    }
    log.info(`${count} ta event ulandi.`);
}
//# sourceMappingURL=registry.js.map