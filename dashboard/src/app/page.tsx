import Image from 'next/image';
import Link from 'next/link';
import { Tricolor } from '@/components/brand';
import { Icon, type IconName } from '@/components/icons';
import { SiteFooter, SiteHeader } from '@/components/site';
import { inviteUrl } from '@/lib/env';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Kodlar api/auth/callback/route.ts dan keladi. */
const ERRORS: Record<string, string> = {
  'bekor-qilindi': 'Kirish bekor qilindi.',
  'kod-yoq': 'Discord avtorizatsiya kodini qaytarmadi.',
  'state-mos-emas': 'Kirish havolasining muddati o‘tgan. Qaytadan urinib ko‘ring.',
  'discord-sozlama':
    'Discord ilova kalitlari noto‘g‘ri: DISCORD_CLIENT_ID yoki DISCORD_CLIENT_SECRET mos emas (secret almashtirilgan bo‘lishi mumkin).',
  'redirect-mos-emas':
    'Redirect URI mos emas: NEXT_PUBLIC_APP_URL va Developer Portal → OAuth2 → Redirects dagi manzilni tekshiring.',
  'kod-eskirgan': 'Kirish kodi eskirgan yoki allaqachon ishlatilgan. Qaytadan kiring.',
  'discord-limit': 'Discord so‘rovlarni vaqtincha chekladi. Bir-ikki daqiqadan keyin qayta urinib ko‘ring.',
  'discord-tarmoq': 'Serverdan Discord’ga ulanib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.',
  'token-olinmadi': 'Discord kirishni rad etdi.',
  'foydalanuvchi-topilmadi': 'Discord profilingizni olib bo‘lmadi.',
  'serverlar-olinmadi': 'Discord serverlaringiz ro‘yxatini olib bo‘lmadi. Qaytadan kiring.',
};

const STATS = [
  { value: '33', label: 'slash komanda' },
  { value: '9', label: 'AutoMod qoidasi' },
  { value: '3', label: 'til: uz · ru · en' },
  { value: 'MIT', label: 'ochiq kod, bepul' },
];

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'shieldCheck',
    title: 'Moderatsiya',
    text: 'Ban, vaqtinchalik ban, kick, timeout va ogohlantirishlar. Har bir amal raqamlangan case sifatida tarixda qoladi.',
  },
  {
    icon: 'list',
    title: 'Batafsil loglar',
    text: 'O‘chirilgan va tahrirlangan xabarlar, a‘zolar kirib-chiqishi, rollar, banlar va ovozli kanallar — alohida kanallarga.',
  },
  {
    icon: 'zap',
    title: 'Avtomatik jazo',
    text: 'Masalan: 3-ogohlantirishda 1 soat timeout, 5-sida ban. Chegaralarni o‘zingiz belgilaysiz.',
  },
  {
    icon: 'userPlus',
    title: 'Kutib olish',
    text: 'Xush kelibsiz va xayrlashuv xabarlari, yangi a‘zolarga avtomatik rol berish.',
  },
  {
    icon: 'layers',
    title: 'Tugmali rollar',
    text: 'A‘zolar bitta tugma bosib o‘zlariga rol oladi yoki olib tashlaydi.',
  },
  {
    icon: 'globe',
    title: 'O‘z tilingizda',
    text: 'Bot va panel o‘zbek tilida. Rus va ingliz tillari ham bor — har bir server o‘zi tanlaydi.',
  },
];

const RULES = [
  'Spam',
  'Takroriy xabar',
  'Taklif havolalari',
  'Tashqi havolalar',
  'Mention toshqini',
  'KATTA HARFLAR',
  'Emoji toshqini',
  'Taqiqlangan so‘zlar',
  'Reyd himoyasi',
];

/** Bot normalize() funksiyasining haqiqiy natijalari. */
const BYPASSES = ['R3KLAMA', 'р е к л а м а', 'r.e.k.l.a.m.a', 'RЕКЛАМА'];

const COMMANDS: { name: string; args?: string; text: string }[] = [
  { name: 'ban', args: 'user duration reason', text: 'Doimiy yoki vaqtinchalik ban' },
  { name: 'timeout', args: 'user duration', text: 'A‘zoni vaqtincha ovozsiz qilish' },
  { name: 'warn', args: 'user reason', text: 'Ogohlantirish va avtomatik jazo' },
  { name: 'purge', args: 'amount user', text: 'Xabarlarni ommaviy o‘chirish' },
  { name: 'lock', args: 'channel', text: 'Kanalni vaqtincha yopish' },
  { name: 'history', args: 'user', text: 'Foydalanuvchining moderatsiya tarixi' },
  { name: 'automod', args: 'toggle feature', text: 'AutoMod qoidalarini sozlash' },
  { name: 'buttonrole', args: 'panel', text: 'Tugmali rollar paneli' },
];

const STEPS = [
  { title: 'Serverga qo‘shing', text: 'Bir marta bosish bilan botni serveringizga taklif qiling.' },
  { title: 'Sozlang', text: 'Panel yoki /config orqali log kanallari, til va AutoMod qoidalarini belgilang.' },
  { title: 'Xotirjam bo‘ling', text: 'Bot spam va qoidabuzarlarni kechayu kunduz kuzatib boradi.' },
];

const FAQ = [
  {
    q: 'UzCord pullikmi?',
    a: 'Yo‘q. Bot to‘liq bepul, premium tariflar va reklama yo‘q. Kod MIT litsenziyasi ostida ochiq.',
  },
  {
    q: 'Xabarlarimiz saqlanadimi?',
    a: 'Yo‘q. AutoMod xabarlarni faqat xotirada tekshiradi, bazaga yozmaydi. Faqat moderatsiya tarixi (kim, qachon, nima uchun) saqlanadi.',
  },
  {
    q: 'Botga qanday ruxsatlar kerak?',
    a: 'Xabarlarni boshqarish, a‘zolarni ban/kick/timeout qilish va rollarni boshqarish. Botning roli boshqariladigan rollardan yuqorida turishi kerak.',
  },
  {
    q: 'Botni o‘zim ishga tushira olamanmi?',
    a: 'Ha. Kod GitHub’da ochiq — o‘z serveringizda yoki VPS’da ishga tushirish bo‘yicha batafsil qo‘llanma bor.',
  },
];

function ChatPreview() {
  return (
    <div className="relative">
      {/* Kanal oynasi */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800/90 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 text-sm">
          <span className="text-slate-500">#</span>
          <span className="font-medium text-slate-200">umumiy-chat</span>
          <span className="ml-auto flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-500" />
          </span>
        </div>

        <div className="space-y-4 px-4 py-5 text-[13px]">
          <Message color="bg-amber-600" name="Dilnoza" time="21:04">
            Bugun kechqurun turnir bo‘ladimi?
          </Message>
          <Message color="bg-violet-600" name="Jasur" time="21:05">
            Ha, soat 22:00 da boshlanadi
          </Message>
          <div className="opacity-50">
            <Message color="bg-rose-700" name="Bekzod" time="21:05">
              <span className="line-through decoration-flag-red/80">zo‘r server bor, kiringlar discord.gg/xyz…</span>
            </Message>
          </div>
          <div className="flex gap-3">
            <Image alt="" className="h-9 w-9 shrink-0 rounded-full" height={36} src="/brand/logo.png" width={36} />
            <div className="min-w-0">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-brand-light">UzCord</span>
                <span className="rounded bg-brand px-1 text-[10px] font-bold leading-4 text-ink-950">BOT</span>
                <span className="text-[11px] text-slate-500">21:05</span>
              </p>
              <p className="mt-0.5 text-slate-300">
                <span className="rounded bg-brand/20 px-1 text-brand-light">@Bekzod</span>, xabaringiz o‘chirildi.
                Sabab: <strong className="text-white">Discord taklif havolasi</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mod-log embed — chat ostidan biroz chiqib turadi, xabarlarni yopmaydi */}
      <p className="ml-2 mt-5 text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:-ml-6"># mod-log</p>
      <div className="relative ml-2 mt-2 w-64 rounded-xl border border-white/10 bg-ink-950/95 p-4 shadow-2xl shadow-black/60 backdrop-blur sm:-ml-6 sm:w-72">
        <div className="flex gap-3">
          <div aria-hidden="true" className="tricolor-v w-1 shrink-0 rounded-full" />
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-white">Case #128 — warn</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-slate-400">
              <dt className="text-slate-500">Foydalanuvchi</dt>
              <dd className="truncate text-slate-200">Bekzod</dd>
              <dt className="text-slate-500">Moderator</dt>
              <dd className="truncate text-slate-200">UzCord AutoMod</dd>
              <dt className="text-slate-500">Sabab</dt>
              <dd className="truncate text-amber-300">Taklif havolasi</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({
  name,
  time,
  color,
  children,
}: {
  name: string;
  time: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${color}`}>
        {name.slice(0, 1)}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-2">
          <span className="font-semibold text-slate-100">{name}</span>
          <span className="text-[11px] text-slate-500">{time}</span>
        </p>
        <p className="mt-0.5 text-slate-300">{children}</p>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-balance font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      {text ? <p className="mt-4 text-pretty leading-relaxed text-slate-400">{text}</p> : null}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; holat?: string }>;
}) {
  const { error, holat } = await searchParams;
  const httpStatus = holat && /^\d{3}$/.test(holat) ? holat : null;
  const session = await getSession();
  const panelHref = session ? '/dashboard' : '/api/auth/login';

  return (
    <>
      <SiteHeader signedIn={Boolean(session)} />

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              alt=""
              className="object-cover object-center opacity-[0.22] [mask-image:linear-gradient(to_bottom,black_10%,transparent_85%)]"
              fill
              priority
              sizes="100vw"
              src="/brand/flag.png"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/80 to-ink-900" />
            <div className="pattern-girih absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <div>
              {error ? (
                <p className="mb-6 flex max-w-xl items-start gap-2 rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" name="alert" />
                  <span>
                    {ERRORS[error] ?? `Kirishda muammo: ${error}`}
                    {httpStatus ? <span className="text-red-400/70"> (HTTP {httpStatus})</span> : null}
                  </span>
                </p>
              ) : null}

              <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3.5 text-xs text-slate-300">
                <Tricolor className="h-3.5 w-6 rounded-full" />
                O‘zbek jamoalari uchun · ochiq kodli
              </span>

              <h1 className="mt-6 text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                Serveringiz uchun <span className="text-gradient">o‘zbekcha</span> moderator
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-400">
                UzCord spam, reklama va qoidabuzarlarni avtomatik to‘xtatadi, har bir amalni qayd etadi va
                hammasini o‘zbek tilida tushuntiradi. Sozlash — bir necha daqiqa.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a className="btn-primary px-5 py-3 text-[15px]" href={inviteUrl} rel="noreferrer" target="_blank">
                  <Icon className="h-4 w-4" name="plus" />
                  Botni serverga qo‘shish
                </a>
                <Link className="btn-ghost px-5 py-3 text-[15px]" href={panelHref}>
                  {session ? 'Panelga o‘tish' : 'Panelga kirish'}
                  <Icon className="h-4 w-4" name="arrowRight" />
                </Link>
              </div>

              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                {['Bepul, reklamasiz', 'Xabarlar saqlanmaydi', 'Ochiq kod'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-leaf" name="check" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mr-0">
              <div className="absolute -inset-10 -z-10 rounded-full bg-brand/20 blur-3xl" />
              <ChatPreview />
            </div>
          </div>
        </section>

        {/* ── Raqamlar ───────────────────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-ink-950/50">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-white/[0.06] px-5 lg:grid-cols-4 lg:divide-x">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-2 py-8 text-center lg:px-6">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-3xl font-semibold text-white">{stat.value}</dd>
                <dd className="mt-1 text-sm text-slate-500">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Imkoniyatlar ───────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-24" id="imkoniyatlar">
          <SectionHeading
            eyebrow="Imkoniyatlar"
            text="Mashhur xorijiy botlardagi asosiy funksiyalar — bitta botda, o‘z tilingizda."
            title="Serverni boshqarish uchun kerakli hamma narsa"
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-ink-600 bg-ink-600 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="group bg-ink-800 p-6 transition-colors hover:bg-ink-700/80">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-500 bg-ink-900 text-brand-light transition-colors group-hover:border-brand/40">
                  <Icon name={feature.icon} />
                </span>
                <h3 className="mt-5 font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── AutoMod ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-28" id="automod">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="AutoMod"
                text="Bot har bir xabarni bir zumda tekshiradi. Qoidabuzar xabar o‘chiriladi, muallif jazolanadi, moderatorlar esa mod-log kanalida hisobot oladi."
                title="Aldab o‘tib bo‘lmaydigan filtr"
              />
              <ul className="mt-8 flex flex-wrap gap-2">
                {RULES.map((rule) => (
                  <li key={rule} className="rounded-full border border-ink-500 bg-ink-800 px-3 py-1 text-sm text-slate-300">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card relative overflow-hidden">
              <div className="pattern-girih absolute inset-0 opacity-60" />
              <div className="relative">
                <p className="text-sm text-slate-400">
                  Taqiqlangan so‘z: <code className="rounded bg-ink-900 px-1.5 py-0.5 text-white">reklama</code>
                </p>
                <ul className="mt-5 space-y-2.5">
                  {BYPASSES.map((attempt) => (
                    <li
                      key={attempt}
                      className="flex items-center justify-between gap-4 rounded-xl border border-ink-600 bg-ink-900/70 px-4 py-3"
                    >
                      <code className="truncate font-mono text-sm text-slate-200">{attempt}</code>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-red-300">
                        <Icon className="h-3.5 w-3.5" name="x" />
                        ushlandi
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs leading-relaxed text-slate-500">
                  Kirill va lotin, raqam bilan almashtirilgan harflar, oraliq belgilar — barchasi bir xil
                  ko‘rinishga keltirilib tekshiriladi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Komandalar ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-28" id="komandalar">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <SectionHeading
                eyebrow="Komandalar"
                text="Barcha komandalar Discord’ning slash menyusida izohlari bilan chiqadi — hech narsani yodlash shart emas."
                title="Tanish slash komandalar"
              />
              <ol className="mt-10 space-y-6">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10 font-display text-sm font-semibold text-brand-light">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white">{step.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="overflow-hidden rounded-2xl border border-ink-600 bg-ink-950 shadow-card">
              <div className="flex items-center gap-2 border-b border-ink-700 px-4 py-3 text-xs text-slate-500">
                <Icon className="h-4 w-4" name="code" />
                Slash komandalar
              </div>
              <ul className="divide-y divide-ink-700/70">
                {COMMANDS.map((command) => (
                  <li key={command.name} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <code className="font-mono text-sm">
                      <span className="text-brand-light">/{command.name}</span>
                      {command.args ? <span className="text-slate-600"> {command.args}</span> : null}
                    </code>
                    <span className="text-sm text-slate-400">{command.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Savollar ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl scroll-mt-20 px-5 pt-28" id="savollar">
          <div className="text-center">
            <p className="eyebrow">Savollar</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Ko‘p so‘raladigan savollar
            </h2>
          </div>
          <div className="mt-10 divide-y divide-ink-600 rounded-2xl border border-ink-600 bg-ink-800/60">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-100">
                  {item.q}
                  <Icon className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-45" name="plus" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pt-28">
          <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 px-6 py-16 text-center sm:px-16">
            <Image alt="" className="-z-20 object-cover opacity-40" fill sizes="(max-width: 1200px) 100vw, 1150px" src="/brand/flag.png" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/60" />
            <Image alt="" className="mx-auto rounded-full ring-4 ring-white/10" height={72} src="/brand/logo.png" width={72} />
            <h2 className="mx-auto mt-6 max-w-xl text-balance font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Serveringizni bugunoq tartibga soling
            </h2>
            <p className="mx-auto mt-4 max-w-md text-slate-300">
              Qo‘shish bepul va bir daqiqa vaqt oladi. Keyin hammasini panel orqali sozlaysiz.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a className="btn-primary px-5 py-3 text-[15px]" href={inviteUrl} rel="noreferrer" target="_blank">
                <Icon className="h-4 w-4" name="plus" />
                Botni qo‘shish
              </a>
              <a
                className="btn-ghost px-5 py-3 text-[15px]"
                href="https://github.com/samirdevuz/uzcord"
                rel="noreferrer"
                target="_blank"
              >
                <Icon className="h-4 w-4" name="code" />
                Manba kodi
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
