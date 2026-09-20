/**
 * Matnni "aldash"ga qarshi normallashtirish.
 * Maqsad: "s0z", "s-o-z", "sooooz", "СЎЗ" kabi variantlarni bir ko'rinishga keltirish.
 */

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '6': 'b',
  '7': 't',
  '8': 'b',
  '9': 'g',
  '@': 'a',
  $: 's',
  '!': 'i',
  '|': 'i',
  '+': 't',
};

/** Kirill harflarini lotinga o'tkazish (o'zbek va rus uchun). */
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

export function transliterate(text: string): string {
  let result = '';
  for (const char of text.toLowerCase()) {
    result += CYRILLIC[char] ?? char;
  }
  return result;
}

/**
 * To'liq normallashtirish: kichik harf, kirill -> lotin, leet -> harf,
 * urg'u belgilarini olib tashlash, takroriy harflarni qisqartirish,
 * harf va raqamdan boshqa hamma narsani olib tashlash.
 */
export function normalize(text: string): string {
  let result = transliterate(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  result = result.replace(/[013456789@$!|+]/g, (char) => LEET[char] ?? char);
  result = result.replace(/[^a-z0-9]/g, '');
  // "sooooz" -> "sooz" (ikki martadan ortiq takrorni qisqartirish)
  result = result.replace(/(.)\1{2,}/g, '$1$1');
  return result;
}

export const INVITE_PATTERN =
  /(?:discord(?:app)?\.com\/invite|discord\.(?:gg|io|me|li|link)|dsc\.gg|invite\.gg)\/[a-z0-9-_]+/i;

export const LINK_PATTERN = /https?:\/\/([^\s/$.?#]+\.[^\s]*)/gi;

export const CUSTOM_EMOJI_PATTERN = /<a?:\w+:\d+>/g;

export const UNICODE_EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;

/** Xabardagi barcha havolalarning domenlarini qaytaradi. */
export function extractDomains(text: string): string[] {
  const domains: string[] = [];
  LINK_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    const host = match[1].toLowerCase().replace(/^www\./, '');
    domains.push(host);
  }
  return domains;
}

/** KATTA HARFLAR ulushi (0–100). Harflar 10 tadan kam bo'lsa 0 qaytaradi. */
export function capsPercent(text: string): number {
  const letters = text.replace(/[^a-zA-Zа-яА-ЯёЁўЎқҚғҒҳҲ]/g, '');
  if (letters.length < 10) return 0;
  const upper = letters.replace(/[^A-ZА-ЯЁЎҚҒҲ]/g, '').length;
  return Math.round((upper / letters.length) * 100);
}

export function countEmojis(text: string): number {
  const custom = text.match(CUSTOM_EMOJI_PATTERN)?.length ?? 0;
  const unicode = text.match(UNICODE_EMOJI_PATTERN)?.length ?? 0;
  return custom + unicode;
}

/** Taqiqlangan so'z normallashtirilgan matn ichida bormi? */
export function containsWord(normalizedText: string, words: string[]): string | null {
  for (const word of words) {
    const normalizedWord = normalize(word);
    if (normalizedWord.length === 0) continue;
    if (normalizedText.includes(normalizedWord)) return word;
  }
  return null;
}
