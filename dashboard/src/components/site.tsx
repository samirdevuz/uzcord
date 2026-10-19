import Link from 'next/link';
import { inviteUrl } from '@/lib/env';
import { Logo, Tricolor } from './brand';
import { Icon } from './icons';

const GITHUB_URL = 'https://github.com/samirdevuz/uzcord';
const DISCORD_URL = 'https://discord.gg/JGfWtj3ydt';

/** Ommaviy sahifalar (landing, privacy, terms) uchun umumiy sarlavha. */
export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-900/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Logo />
        <div className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
          <Link className="transition-colors hover:text-white" href="/#imkoniyatlar">
            Imkoniyatlar
          </Link>
          <Link className="transition-colors hover:text-white" href="/#automod">
            AutoMod
          </Link>
          <Link className="transition-colors hover:text-white" href="/#komandalar">
            Komandalar
          </Link>
          <Link className="transition-colors hover:text-white" href="/#savollar">
            Savollar
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <a className="btn-ghost hidden sm:inline-flex" href={inviteUrl} rel="noreferrer" target="_blank">
            Serverga qo‘shish
          </a>
          <Link className="btn-primary" href={signedIn ? '/dashboard' : '/api/auth/login'}>
            {signedIn ? 'Panel' : 'Kirish'}
            <Icon className="h-4 w-4" name="arrowRight" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

/** Huquqiy sahifalar (privacy, terms) uchun umumiy qobiq. */
export function LegalPage({
  title,
  updated,
  signedIn,
  children,
}: {
  title: string;
  updated: string;
  signedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
          <div className="pattern-girih absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="mx-auto max-w-3xl px-5 pb-12 pt-16">
            <Link className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300" href="/">
              <Icon className="h-3.5 w-3.5" name="arrowLeft" />
              Bosh sahifa
            </Link>
            <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm text-slate-500">Oxirgi yangilanish: {updated}</p>
          </div>
        </section>
        <div
          className="mx-auto max-w-3xl px-5 pt-12 [&_a]:text-brand-light [&_a]:underline-offset-2 hover:[&_a]:underline
                     [&_h2]:font-display [&_h2]:!text-base [&_h2]:tracking-tight [&_section]:border-b
                     [&_section]:border-white/[0.05] [&_section]:pb-6"
        >
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-white/[0.06] bg-ink-950">
      <Tricolor className="absolute inset-x-0 top-0 h-[2px] opacity-80" />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
            O‘zbek Discord jamoalari uchun yaratilgan ochiq kodli moderatsiya boti. Bepul va reklamasiz.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loyiha</p>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
            <li>
              <a className="hover:text-white" href={inviteUrl} rel="noreferrer" target="_blank">
                Botni qo‘shish
              </a>
            </li>
            <li>
              <Link className="hover:text-white" href="/dashboard">
                Boshqaruv paneli
              </Link>
            </li>
            <li>
              <a className="hover:text-white" href={GITHUB_URL} rel="noreferrer" target="_blank">
                GitHub
              </a>
            </li>
            <li>
              <a className="hover:text-white" href={DISCORD_URL} rel="noreferrer" target="_blank">
                Yordam serveri
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Huquqiy</p>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-500">
            <li>
              <Link className="hover:text-white" href="/privacy">
                Maxfiylik siyosati
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/terms">
                Foydalanish shartlari
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/[0.04]">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs text-slate-600">
          © 2026 samirdev.uz · MIT litsenziyasi. Discord — Discord Inc. ning savdo belgisi; UzCord u bilan
          bog‘liq emas.
        </p>
      </div>
    </footer>
  );
}
