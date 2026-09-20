const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

const COLORS: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

// config.ts ni bu yerda import qilmaymiz — logger config yuklanishidan oldin ham
// ishlashi kerak. Daraja to'g'ridan-to'g'ri muhit o'zgaruvchisidan olinadi.
const threshold = LEVELS[(process.env.LOG_LEVEL?.trim() as Level) || 'info'] ?? LEVELS.info;

function stamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function write(level: Level, scope: string, message: unknown, ...rest: unknown[]): void {
  if (LEVELS[level] < threshold) return;
  const prefix = `${COLORS[level]}${stamp()} ${level.toUpperCase().padEnd(5)}${RESET} [${scope}]`;
  const target = level === 'error' ? console.error : console.log;
  target(prefix, message, ...rest);
}

export interface Logger {
  debug(message: unknown, ...rest: unknown[]): void;
  info(message: unknown, ...rest: unknown[]): void;
  warn(message: unknown, ...rest: unknown[]): void;
  error(message: unknown, ...rest: unknown[]): void;
  child(scope: string): Logger;
}

export function createLogger(scope = 'uzcord'): Logger {
  return {
    debug: (m, ...r) => write('debug', scope, m, ...r),
    info: (m, ...r) => write('info', scope, m, ...r),
    warn: (m, ...r) => write('warn', scope, m, ...r),
    error: (m, ...r) => write('error', scope, m, ...r),
    child: (sub: string) => createLogger(`${scope}:${sub}`),
  };
}

export const logger = createLogger();
