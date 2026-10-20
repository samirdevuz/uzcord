/** Tag nomi: harf (har qanday alifbo), raqam, `-` va `_`; 1–32 belgi. */
const TAG_NAME = /^[\p{L}\p{N}_-]{1,32}$/u;

export function normalizeTagName(input: string): string | null {
  const name = input.trim().toLowerCase();
  return TAG_NAME.test(name) ? name : null;
}

/** Xabar havolasi (https://discord.com/channels/g/c/m) yoki ID dan qismlarni ajratadi. */
export function parseMessageReference(input: string): { channelId: string | null; messageId: string } | null {
  const trimmed = input.trim();
  const link = trimmed.match(/channels\/(?:\d+|@me)\/(\d+)\/(\d+)/);
  if (link) return { channelId: link[1], messageId: link[2] };
  if (/^\d{15,21}$/.test(trimmed)) return { channelId: null, messageId: trimmed };
  return null;
}
