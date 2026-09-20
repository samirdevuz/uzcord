import Link from 'next/link';

export const metadata = { title: 'Foydalanish shartlari' };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <Link className="text-sm text-slate-500 hover:text-slate-300" href="/">
        ← Bosh sahifa
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-white">Foydalanish shartlari</h1>
      <p className="mt-2 text-sm text-slate-500">Oxirgi yangilanish: 2026-yil 20-sentabr</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Foydalanish</h2>
          <p>
            Bot Discord serverlarini moderatsiya qilish uchun mo‘ljallangan. Uni serverga qo‘shish
            orqali siz ushbu shartlarni va{' '}
            <Link className="text-brand hover:underline" href="/privacy">
              maxfiylik siyosatini
            </Link>{' '}
            qabul qilasiz.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">2. Taqiqlanadi</h2>
          <ul className="list-inside list-disc space-y-1 text-slate-400">
            <li>
              Discord{' '}
              <a
                className="text-brand hover:underline"
                href="https://discord.com/terms"
                rel="noreferrer"
                target="_blank"
              >
                shartlari
              </a>{' '}
              yoki jamoa qoidalariga zid maqsadlarda foydalanish.
            </li>
            <li>Botga spam yuborish yoki uni ataylab ortiqcha yuklash.</li>
            <li>Boshqa foydalanuvchilarni ta‘qib qilish, qo‘rqitish yoki zarar yetkazish.</li>
            <li>Zaifliklarni yomon niyatda qidirish yoki ulardan foydalanish.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Mas‘uliyat</h2>
          <p>
            Bot “qanday bo‘lsa shundayligicha” taqdim etiladi. Muallif botning noto‘g‘ri
            sozlanishi, ma‘lumot yo‘qolishi, xizmatning vaqtincha ishlamasligi yoki moderatorlar
            xatolari uchun javobgar emas. Server egasi botni to‘g‘ri sozlash va unga berilgan
            ruxsatlar uchun to‘liq javobgar.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Ochiq kod</h2>
          <p>
            UzCord MIT litsenziyasi ostida tarqatiladi. Kodni o‘zingizda ishga tushirishingiz,
            o‘zgartirishingiz va tarqatishingiz mumkin:{' '}
            <a
              className="text-brand hover:underline"
              href="https://github.com/samirdevuz/uzcord"
              rel="noreferrer"
              target="_blank"
            >
              github.com/samirdevuz/uzcord
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
