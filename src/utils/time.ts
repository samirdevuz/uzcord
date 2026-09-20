export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

/** Discord timeout uchun maksimal muddat — 28 kun. */
export const MAX_TIMEOUT = 28 * DAY;

const UNITS: Record<string, number> = {
  s: SECOND,
  m: MINUTE,
  h: HOUR,
  d: DAY,
  w: WEEK,
};

const PATTERN = /(\d+)\s*(s|m|h|d|w)/gi;

/**
 * "1h30m", "7d", "2 hafta" kabi matnni millisekundga aylantiradi.
 * Noto'g'ri format bo'lsa `null` qaytaradi.
 */
export function parseDuration(input: string | null | undefined): number | null {
  if (!input) return null;
  const normalized = input
    .toLowerCase()
    .replace(/soniya|sekund|sec/g, 's')
    .replace(/daqiqa|minut|min/g, 'm')
    .replace(/soat|hour/g, 'h')
    .replace(/kun|day/g, 'd')
    .replace(/hafta|week/g, 'w');

  let total = 0;
  let matched = false;
  PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PATTERN.exec(normalized)) !== null) {
    const amount = Number.parseInt(match[1], 10);
    const unit = UNITS[match[2]];
    if (!Number.isFinite(amount) || !unit) continue;
    total += amount * unit;
    matched = true;
  }

  if (!matched || total <= 0) return null;
  return total;
}

const LABELS: Array<[number, string]> = [
  [WEEK, 'hafta'],
  [DAY, 'kun'],
  [HOUR, 'soat'],
  [MINUTE, 'daqiqa'],
  [SECOND, 'soniya'],
];

/** Millisekundni o'qishga qulay ko'rinishga aylantiradi: "2 kun 3 soat". */
export function formatDuration(ms: number | null | undefined, maxParts = 2): string {
  if (!ms || ms <= 0) return '0 soniya';
  const parts: string[] = [];
  let remaining = ms;
  for (const [size, label] of LABELS) {
    if (remaining < size) continue;
    const amount = Math.floor(remaining / size);
    remaining -= amount * size;
    parts.push(`${amount} ${label}`);
    if (parts.length >= maxParts) break;
  }
  return parts.length > 0 ? parts.join(' ') : '1 soniyadan kam';
}

/** Discord uchun <t:...:R> ko'rinishidagi nisbiy vaqt. */
export function relative(timestampMs: number): string {
  return `<t:${Math.floor(timestampMs / 1000)}:R>`;
}

/** Discord uchun <t:...:f> ko'rinishidagi to'liq sana. */
export function fullDate(timestampMs: number): string {
  return `<t:${Math.floor(timestampMs / 1000)}:f>`;
}

export function shortDate(timestampMs: number): string {
  return `<t:${Math.floor(timestampMs / 1000)}:d>`;
}
