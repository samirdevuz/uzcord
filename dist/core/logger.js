"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const COLORS = {
    debug: '\x1b[90m',
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
};
const RESET = '\x1b[0m';
// config.ts ni bu yerda import qilmaymiz — logger config yuklanishidan oldin ham
// ishlashi kerak. Daraja to'g'ridan-to'g'ri muhit o'zgaruvchisidan olinadi.
const threshold = LEVELS[process.env.LOG_LEVEL?.trim() || 'info'] ?? LEVELS.info;
function stamp() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
function write(level, scope, message, ...rest) {
    if (LEVELS[level] < threshold)
        return;
    const prefix = `${COLORS[level]}${stamp()} ${level.toUpperCase().padEnd(5)}${RESET} [${scope}]`;
    const target = level === 'error' ? console.error : console.log;
    target(prefix, message, ...rest);
}
function createLogger(scope = 'uzcord') {
    return {
        debug: (m, ...r) => write('debug', scope, m, ...r),
        info: (m, ...r) => write('info', scope, m, ...r),
        warn: (m, ...r) => write('warn', scope, m, ...r),
        error: (m, ...r) => write('error', scope, m, ...r),
        child: (sub) => createLogger(`${scope}:${sub}`),
    };
}
exports.logger = createLogger();
//# sourceMappingURL=logger.js.map