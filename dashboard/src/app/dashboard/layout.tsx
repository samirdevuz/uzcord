import type { ReactNode } from 'react';
import { Logo, Tricolor } from '@/components/brand';
import { Icon } from '@/components/icons';
import { userAvatarUrl } from '@/lib/discord';
import { requireSession } from '@/lib/guard';

// Shablon qayta e'lon qilinadi — oddiy satr ichki sahifalarda "· UzCord" qo'shimchasini uzib qo'yadi.
export const metadata = { title: { default: 'Boshqaruv paneli', template: '%s · UzCord' } };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return (
    <div className="relative min-h-screen">
      <div aria-hidden="true" className="pattern-girih pointer-events-none fixed inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-900/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Logo href="/dashboard" size={30} />
            <span className="hidden rounded-md border border-ink-500 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 sm:inline">
              Panel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2.5 rounded-full border border-ink-600 bg-ink-800/80 py-1 pl-1 pr-3 text-sm text-slate-200">
              <img alt="" className="h-7 w-7 rounded-full" src={userAvatarUrl(session.userId, session.avatar)} />
              <span className="hidden max-w-[10rem] truncate sm:inline">{session.username}</span>
            </span>
            {/* <Link> emas, oddiy <a>: Link oldindan yuklab (prefetch) qo'yib,
                foydalanuvchini bilmagan holda tizimdan chiqarib yuborishi mumkin. */}
            <a
              aria-label="Chiqish"
              className="btn-ghost h-9 w-9 !p-0 text-slate-400"
              href="/api/auth/logout"
              title="Chiqish"
            >
              <Icon className="h-4 w-4" name="logout" />
            </a>
          </div>
        </nav>
        <Tricolor className="h-[2px] w-full opacity-70" />
      </header>
      {children}
    </div>
  );
}
