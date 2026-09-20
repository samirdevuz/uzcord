import { redirect } from 'next/navigation';
import { getSession, type Session, type SessionGuild } from './session';

/** Tizimga kirmagan bo'lsa — login sahifasiga yuboradi. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/api/auth/login');
  return session;
}

/**
 * Foydalanuvchi shu serverni boshqara olishini tekshiradi.
 *
 * MUHIM: barcha o'qish/yozish amallari service_role kaliti bilan bajariladi,
 * ya'ni RLS himoya qilmaydi. Shuning uchun HAR BIR sahifa va server action
 * shu funksiyadan boshlanishi SHART.
 */
export async function requireGuildAccess(guildId: string): Promise<{
  session: Session;
  guild: SessionGuild;
}> {
  const session = await requireSession();
  const guild = session.guilds.find((item) => item.id === guildId);
  if (!guild) redirect('/dashboard?error=access');
  return { session, guild };
}

/** Server actionlar uchun: redirect o'rniga xatolik qaytaradi. */
export async function assertGuildAccess(guildId: string): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error('Tizimga kiring');
  if (!session.guilds.some((item) => item.id === guildId)) {
    throw new Error("Bu serverni boshqarishga ruxsatingiz yo'q");
  }
  return session;
}
