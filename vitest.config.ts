import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // Modullar import paytida config.ts ni o'qiydi — testlar uchun soxta qiymatlar.
    // Testlar tarmoqqa chiqmaydi: faqat sof funksiyalar tekshiriladi.
    env: {
      DISCORD_TOKEN: 'test-token',
      CLIENT_ID: '100000000000000000',
      SUPABASE_URL: 'http://127.0.0.1:1',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      LOG_LEVEL: 'error',
    },
  },
});
