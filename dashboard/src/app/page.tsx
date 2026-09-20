import Link from 'next/link';
import { inviteUrl } from '@/lib/env';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

const FEATURES = [
  {
    icon: '🛡️',
    title: 'Moderatsiya',
    text: "Ban, vaqtinchalik ban, kick, timeout, ogohlantirish — hammasi case raqami bilan qayd etiladi va tarixi saqlanadi.",
  },
  {
    icon: '🤖',
    title: 'AutoMod',
    text: "Spam, taklif havolalari, mention toshqini, KATTA HARFLAR, taqiqlangan so'zlar va reydlarga qarshi 9 ta qoida.",
  },
  {
    icon: '📋',
    title: 'Loglar',
    text: "Xabar o'chirish/tahrirlash, a'zo kirish-chiqishi, rol o'zgarishlari, banlar va ovozli kanallar.",
  },
  {
    icon: '👋',
    title: 'Kutib olish',
    text: "Xush kelibsiz va xayrlashuv xabarlari, yangi a'zolarga avtomatik rol berish.",
  },
  {
    icon: '🎭',
    title: 'Tugmali rollar',
    text: "A'zolar tugma bosib o'zlariga rol oladi — reaksiya kutib o'tirish shart emas.",
  },
  {
    icon: '🌐',
    title: "O'zbek tilida",
    text: "Butun interfeys o'zbekcha. Rus va ingliz tillari ham bor — har bir server o'zi tanlaydi.",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await getSession();

  return (
    <main>
      {/* ── Sarlavha ───────────────────────────────────────────── */}
      <header className="border-b border-ink-700">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="text-lg font-semibold text-white">
            Uz<span className="text-brand">Cord</span>
          </span>
          <div className="flex items-center gap-3">
            <a className="btn-ghost" href={inviteUrl} rel="noreferrer" target="_blank">
              Serverga qo‘shish
            </a>
            {session ? (
              <Link className="btn-primary" href="/dashboard">
                Boshqaruv paneli
              </Link>
            ) : (
              <Link className="btn-primary" href="/api/auth/login">
                Discord bilan kirish
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-20 text-center">
        {error ? (
          <p className="mx-auto mb-6 max-w-md rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Kirishda muammo: {error}. Qaytadan urinib ko‘ring.
          </p>
        ) : null}

        <h1 className="text-balance text-4xl font-bold leading-tight text-white sm:text-5xl">
          O‘zbek Discord serverlari uchun{' '}
          <span className="text-brand">moderatsiya boti</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-slate-400">
          Carl-bot va Dyno o‘rnini bosa oladigan, to‘liq o‘zbek tilidagi ochiq kodli bot.
          Serveringizni bir necha daqiqada tartibga soling.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a className="btn-primary px-6 py-3" href={inviteUrl} rel="noreferrer" target="_blank">
            Botni serverga qo‘shish
          </a>
          <Link className="btn-ghost px-6 py-3" href={session ? '/dashboard' : '/api/auth/login'}>
            {session ? 'Panelga o‘tish' : 'Panelga kirish'}
          </Link>
        </div>
      </section>

      {/* ── Imkoniyatlar ───────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="card">
              <p className="text-2xl">{feature.icon}</p>
              <h3 className="mt-3 font-semibold text-white">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-ink-700">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500">
          <p>© 2026 samirdev.uz · MIT litsenziyasi</p>
          <div className="flex gap-5">
            <Link className="hover:text-slate-300" href="/privacy">
              Maxfiylik
            </Link>
            <Link className="hover:text-slate-300" href="/terms">
              Shartlar
            </Link>
            <a
              className="hover:text-slate-300"
              href="https://github.com/samirdevuz/uzcord"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
            <a
              className="hover:text-slate-300"
              href="https://discord.gg/JGfWtj3ydt"
              rel="noreferrer"
              target="_blank"
            >
              Discord
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
