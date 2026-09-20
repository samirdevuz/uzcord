import { uz, type TranslationKey } from './uz';
import { ru } from './ru';
import { en } from './en';

export type { TranslationKey };

const TABLES = { uz, ru, en } as const;

export type LocaleCode = keyof typeof TABLES;
export const LOCALES: LocaleCode[] = ['uz', 'ru', 'en'];
export const LOCALE_LABELS: Record<LocaleCode, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

export type Vars = Record<string, string | number | null | undefined>;
export type Translator = (key: TranslationKey, vars?: Vars) => string;

export function isLocale(value: string): value is LocaleCode {
  return (LOCALES as string[]).includes(value);
}

function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}

/** Tarjimani oladi; topilmasa o'zbekchaga, u ham bo'lmasa kalitning o'ziga qaytadi. */
export function t(locale: string, key: TranslationKey, vars?: Vars): string {
  const table = (isLocale(locale) ? TABLES[locale] : uz) as Partial<Record<TranslationKey, string>>;
  const template = table[key] ?? uz[key] ?? key;
  return format(template, vars);
}

export function createTranslator(locale: string): Translator {
  return (key, vars) => t(locale, key, vars);
}
