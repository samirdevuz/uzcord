'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './icons';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export interface NavSection {
  title: string | null;
  items: NavItem[];
}

/**
 * Yagona client komponent — faqat faol bo'limni belgilash uchun.
 * usePathname server render paytida ham ishlaydi, shuning uchun
 * menyu JavaScript o'chiq bo'lsa ham to'g'ri ko'rinadi.
 */
export function GuildNav({ sections, base }: { sections: NavSection[]; base: string }) {
  const pathname = usePathname();

  return (
    // Mobilda qatorlarga o'raladi — gorizontal aylantirishda faol bo'lim ko'rinmay qolardi.
    <nav className="space-y-4">
      {sections.map((section) => (
        <div key={section.title ?? 'main'}>
          {section.title ? (
            <p className="mb-1.5 hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600 lg:block">
              {section.title}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
            {section.items.map((item) => {
              // Umumiy ko'rinish faqat aniq mos kelganda faol.
              const active =
                item.href === base ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition-colors lg:gap-3 lg:border-transparent ${
                    active
                      ? 'border-brand/30 bg-brand/10 font-medium text-white'
                      : 'border-ink-600 text-slate-400 hover:bg-ink-700/70 hover:text-slate-100'
                  }`}
                  href={item.href}
                >
                  {active ? <span className="absolute inset-y-1.5 left-0 hidden w-[3px] rounded-full bg-brand lg:block" /> : null}
                  <Icon className={`h-4 w-4 ${active ? 'text-brand-light' : ''}`} name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
