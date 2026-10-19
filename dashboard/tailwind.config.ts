import type { Config } from 'tailwindcss';

/**
 * Ranglar O'zbekiston bayrog'idan olingan:
 *   brand (ko'k)  — asosiy rang, tugmalar va faol holatlar
 *   leaf (yashil) — muvaffaqiyat, yoqilgan holat
 *   flag (qizil)  — faqat ingichka ajratuvchi chiziqlar uchun (bayroqdagidek)
 */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#14a9c9',
          light: '#5fd0e8',
          dark: '#0b7f99',
        },
        leaf: {
          DEFAULT: '#1eb53a',
          light: '#4ad466',
          dark: '#168a2c',
        },
        flag: {
          red: '#ce1126',
        },
        ink: {
          950: '#05080e',
          900: '#080c14',
          800: '#0d131e',
          700: '#131b29',
          600: '#1a2435',
          500: '#253147',
          400: '#36445e',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(20 169 201 / 0.25), 0 12px 40px -12px rgb(20 169 201 / 0.45)',
        card: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 20px 40px -24px rgb(0 0 0 / 0.6)',
      },
    },
  },
  plugins: [],
} satisfies Config;
