import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1eb53a',
          dark: '#178c2d',
          light: '#3ddc5f',
        },
        ink: {
          900: '#0b0e13',
          800: '#11151d',
          700: '#171d28',
          600: '#1f2735',
          500: '#2b3446',
          400: '#39455c',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
