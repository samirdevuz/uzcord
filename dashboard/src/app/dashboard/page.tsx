import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Empty, Notice, PageHeader } from '@/components/ui';
import { guildIconUrl } from '@/lib/discord';
import { inviteUrl } from '@/lib/env';
import { requireSession } from '@/lib/guard';
import { db, dbErrorMessage } from '@/lib/supabase';

export const metadata = { title: 'Serverlar' };

/** Taklif havolasini aynan shu server tanlangan holda ochadi. */
function inviteFor(guildId: string): string {
  const url = new URL(inviteUrl);
  url.searchParams.set('guild_id', guildId);
  url.searchParams.set('disable_guild_select', 'true');
  return url.toString();
}

export default async function ServersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await requireSession();
  const ids = session.guilds.map((guild) => guild.id);

  // Bot qaysi serverlarda turganini bazadan bilamiz (bot `ready` va
  // `guildCreate` eventlarida `bot_present` ni yangilab turadi).
  const present = new Map<string, number | null>();
  let dbError: string | null = null;
  if (ids.length > 0) {
    const { data, error: queryError } = await db
      .from('guilds')
      .select('guild_id, member_count')
      .in('guild_id', ids)
      .eq('bot_present', true);
    if (queryError) dbError = dbErrorMessage(queryError);
    for (const row of data ?? []) present.set(row.guild_id as string, row.member_count as number | null);
  }

  // Bot bor serverlar birinchi turadi.
  const guilds = [...session.guilds].sort(
    (a, b) => Number(present.has(b.id)) - Number(present.has(a.id)) || a.name.localeCompare(b.name)
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
      <PageHeader
        description="«Serverni boshqarish» ruxsatiga ega bo‘lgan serverlaringiz. Botni sozlash uchun serverni tanlang."
        title={`Salom, ${session.username}`}
      />

      <div className="space-y-3">
        {error === 'access' ? (
          <Notice tone="error">
            Bu serverni boshqarishga ruxsatingiz yo‘q. Agar ruxsat yaqinda berilgan bo‘lsa — chiqib,
            qaytadan kiring.
          </Notice>
        ) : null}
        {dbError ? <Notice tone="error">{dbError}</Notice> : null}
      </div>

      <div className="mt-6">
        {guilds.length === 0 ? (
          <Empty icon="server">
            Siz boshqara oladigan server topilmadi. Server egasi yoki «Serverni boshqarish» ruxsatiga ega
            bo‘lishingiz kerak.
          </Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guilds.map((guild) => {
              const icon = guildIconUrl(guild.id, guild.icon, 128);
              const hasBot = present.has(guild.id);
              const members = present.get(guild.id);

              return (
                <li
                  key={guild.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-ink-800/70 shadow-card transition-all ${
                    hasBot ? 'border-ink-600 hover:-translate-y-0.5 hover:border-brand/40' : 'border-ink-700'
                  }`}
                >
                  {/* Server ikonkasidan olingan xira fon */}
                  <div className="relative h-20 overflow-hidden bg-gradient-to-br from-ink-600 to-ink-800">
                    {icon ? (
                      <img alt="" className="h-full w-full scale-150 object-cover opacity-30 blur-2xl" src={icon} />
                    ) : null}
                  </div>
                  <div className="-mt-8 px-5 pb-5">
                    {icon ? (
                      <img alt="" className="relative h-16 w-16 rounded-2xl border-4 border-ink-800" src={icon} />
                    ) : (
                      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-ink-800 bg-ink-600 font-display text-xl font-semibold text-slate-200">
                        {guild.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <h2 className="mt-3 truncate font-semibold text-white">{guild.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <span className={`h-1.5 w-1.5 rounded-full ${hasBot ? 'bg-leaf' : 'bg-slate-600'}`} />
                      {hasBot
                        ? members
                          ? `${members.toLocaleString('uz-UZ')} ta a‘zo`
                          : 'Bot ulangan'
                        : 'Bot qo‘shilmagan'}
                    </p>
                    <div className="mt-5">
                      {hasBot ? (
                        <Link className="btn-primary w-full" href={`/dashboard/${guild.id}`}>
                          Sozlash
                          <Icon className="h-4 w-4" name="arrowRight" />
                        </Link>
                      ) : (
                        <a className="btn-ghost w-full" href={inviteFor(guild.id)} rel="noreferrer" target="_blank">
                          <Icon className="h-4 w-4" name="plus" />
                          Botni qo‘shish
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
