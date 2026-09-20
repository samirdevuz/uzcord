function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `[env] "${name}" topilmadi. Lokal ishlatishda .env.example ni nusxalab ` +
        `.env.local yarating; Vercel'da — Project Settings → Environment Variables.`
    );
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

/**
 * Qiymatlar faqat ishlatilganda o'qiladi (lazy getter).
 * Shu tufayli, masalan, landing sahifasi uchun Supabase kaliti
 * bo'lmasa ham sahifa yuklanaveradi.
 *
 * FAQAT server tomonida ishlatiladi — client komponentga import qilmang.
 */
export const env = {
  get appUrl(): string {
    return optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000').replace(/\/$/, '');
  },
  get discordClientId(): string {
    return required('DISCORD_CLIENT_ID');
  },
  get discordClientSecret(): string {
    return required('DISCORD_CLIENT_SECRET');
  },
  get supabaseUrl(): string {
    return required('SUPABASE_URL');
  },
  get supabaseServiceKey(): string {
    return required('SUPABASE_SERVICE_ROLE_KEY');
  },
  get sessionSecret(): string {
    const secret = required('SESSION_SECRET');
    if (secret.length < 32) {
      throw new Error('[env] SESSION_SECRET kamida 32 ta belgidan iborat bo\'lishi kerak.');
    }
    return secret;
  },
};

export const inviteUrl =
  process.env.NEXT_PUBLIC_INVITE_URL ??
  'https://discord.com/oauth2/authorize?client_id=1551057441750257664&scope=bot+applications.commands';
