import Link from 'next/link';

export const metadata = { title: 'Maxfiylik siyosati' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <Link className="text-sm text-slate-500 hover:text-slate-300" href="/">
        ← Bosh sahifa
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-white">Maxfiylik siyosati</h1>
      <p className="mt-2 text-sm text-slate-500">Oxirgi yangilanish: 2026-yil 20-sentabr</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Qanday ma‘lumot saqlanadi</h2>
          <p>
            Bot faqat o‘z vazifasini bajarish uchun zarur bo‘lgan ma‘lumotlarni saqlaydi: server
            IDsi, kanal va rol IDlari, moderatsiya tarixi (foydalanuvchi IDsi, moderator IDsi,
            jazo sababi va muddati), hamda server admini kiritgan taqiqlangan so‘zlar ro‘yxati.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">2. Nima SAQLANMAYDI</h2>
          <ul className="list-inside list-disc space-y-1 text-slate-400">
            <li>Xabarlar matni bazaga yozilmaydi — AutoMod ularni faqat xotirada tekshiradi.</li>
            <li>Shaxsiy xabarlar (DM) o‘qilmaydi.</li>
            <li>Ovozli suhbatlar yozib olinmaydi.</li>
            <li>To‘lov ma‘lumotlari, email va parollar to‘planmaydi.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Boshqaruv paneli</h2>
          <p>
            Panelga Discord OAuth orqali kiriladi. Biz sizdan faqat <code>identify</code> va{' '}
            <code>guilds</code> ruxsatlarini so‘raymiz — ya‘ni foydalanuvchi nomi, avatar va siz
            boshqara oladigan serverlar ro‘yxati. Bu ma‘lumot imzolangan cookie ichida 7 kun
            saqlanadi va bazaga yozilmaydi.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Ma‘lumotlar qayerda</h2>
          <p>
            Ma‘lumotlar Supabase (Postgres) bazasida, Frankfurt (EU) serverlarida saqlanadi.
            Ular uchinchi shaxslarga sotilmaydi va uzatilmaydi.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">5. O‘chirish</h2>
          <p>
            Server egasi yoki foydalanuvchi o‘z ma‘lumotlarini o‘chirishni so‘rashi mumkin. So‘rov
            30 kun ichida bajariladi. Murojaat:{' '}
            <a
              className="text-brand hover:underline"
              href="https://discord.gg/JGfWtj3ydt"
              rel="noreferrer"
              target="_blank"
            >
              Discord serverimiz
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">6. Bolalar xavfsizligi</h2>
          <p>
            Discord shartlariga muvofiq, bot 13 yoshdan kichik foydalanuvchilar uchun
            mo‘ljallanmagan.
          </p>
        </section>
      </div>
    </main>
  );
}
