import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { GuildNav } from '@/components/nav';
import { Notice } from '@/components/ui';
import { guildIconUrl } from '@/lib/discord';
import { inviteUrl } from '@/lib/env';
import { requireGuildAccess } from '@/lib/guard';
import { db, dbErrorMessage } from '@/lib/supabase';

/** Yangi bo'lim qo'shganda shu ro'yxatga yozing. */
const NAV: { path: string; label: string; icon: IconName }[] = [
  { path: '', label: 'Umumiy ko‘rinish', icon: 'grid' },
  { path: '/settings', label: 'Sozlamalar', icon: 'sliders' },
  { path: '/automod', label: 'AutoMod', icon: 'shieldCheck' },
  { path: '/cases', label: 'Moderatsiya tarixi', icon: 'clipboard' },
  { path: '/leveling', label: 'Leveling', icon: 'trending' },
];

export default async function GuildLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  // Ruxsat yo'q bo'lsa /dashboard?error=access ga yo'naltiradi.
  const { guild } = await requireGuildAccess(guildId);

  const { data: row, error } = await db
    .from('guilds')
    .select('bot_present')
    .eq('guild_id', guildId)
    .maybeSingle();

  if (error) {
    // Baza ishlamasa "bot bu serverda yo'q" deb noto'g'ri xulosa chiqarmaymiz.
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <Notice tone="error">{dbErrorMessage(error)}</Notice>
        <div className="mt-6 flex justify-center gap-2">
          <Link className="btn-ghost" href="/dashboard">
            <Icon className="h-4 w-4" name="arrowLeft" />
            Serverlar
          </Link>
          <Link className="btn-primary" href={`/dashboard/${guildId}`}>
            Qayta urinish
          </Link>
        </div>
      </main>
    );
  }

  const icon = guildIconUrl(guild.id, guild.icon, 96);
  const base = `/dashboard/${guildId}`;
  const invite = new URL(inviteUrl);
  invite.searchParams.set('guild_id', guildId);
  invite.searchParams.set('disable_guild_select', 'true');

  const avatar = icon ? (
    <img alt="" className="h-10 w-10 shrink-0 rounded-xl" src={icon} />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-600 font-display font-semibold text-slate-200">
      {guild.name.slice(0, 1).toUpperCase()}
    </span>
  );

  if (!row) {
    // Bot hech qachon bu serverda bo'lmagan — sozlamalar ma'nosiz,
    // bazada keraksiz yozuv ham yaratmaymiz.
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <section className="card text-center">
          <div className="flex justify-center">{avatar}</div>
          <h1 className="mt-4 font-display text-lg font-semibold text-white">Bot «{guild.name}» serverida yo‘q</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
            Sozlashdan oldin UzCord’ni serverga qo‘shing. Qo‘shgandan keyin bu sahifani yangilang.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link className="btn-ghost" href="/dashboard">
              <Icon className="h-4 w-4" name="arrowLeft" />
              Serverlar
            </Link>
            <a className="btn-primary" href={invite.toString()} rel="noreferrer" target="_blank">
              <Icon className="h-4 w-4" name="plus" />
              Botni qo‘shish
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 lg:flex-row lg:gap-10 lg:py-10">
      <aside className="lg:sticky lg:top-24 lg:h-fit lg:w-60 lg:shrink-0">
        <Link
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-300"
          href="/dashboard"
        >
          <Icon className="h-3.5 w-3.5" name="arrowLeft" />
          Barcha serverlar
        </Link>
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-ink-600 bg-ink-800/70 p-3">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{guild.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${row.bot_present === false ? 'bg-amber-400' : 'bg-leaf'}`} />
              {row.bot_present === false ? 'Bot serverda emas' : 'Bot faol'}
            </p>
          </div>
        </div>
        <GuildNav items={NAV.map((item) => ({ href: `${base}${item.path}`, label: item.label, icon: item.icon }))} />
      </aside>

      <main className="min-w-0 flex-1">
        {row.bot_present === false ? (
          <div className="mb-6">
            <Notice tone="warn">
              Bot hozir bu serverda emas. Sozlamalar saqlanadi, lekin bot qaytib qo‘shilmaguncha ishlamaydi.{' '}
              <a className="font-medium underline underline-offset-2" href={invite.toString()} rel="noreferrer" target="_blank">
                Qayta qo‘shish
              </a>
            </Notice>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
