import Link from 'next/link';
import { requireGuildAccess } from '@/lib/guard';
import { db } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ ok?: string; msg?: string }>;
}

export default async function GuildOverviewPage({ params, searchParams }: PageProps) {
  const { guildId } = await params;
  const { ok, msg } = await searchParams;
  const { session, guild } = await requireGuildAccess(guildId);

  // Fetch current guild settings
  const { data: guildSettings } = await db
    .from('guilds')
    .select('*')
    .eq('guild_id', guildId)
    .single();

  const { data: cases } = await db
    .from('mod_cases')
    .select('id', { count: 'exact' })
    .eq('guild_id', guildId);

  const { data: levels } = await db
    .from('member_levels')
    .select('user_id', { count: 'exact' })
    .eq('guild_id', guildId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-8">
            {guild.icon ? (
              <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} className="w-10 h-10 rounded-full border border-slate-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">{guild.name.slice(0, 2).toUpperCase()}</div>
            )}
            <div className="overflow-hidden">
              <h2 className="font-semibold text-sm truncate">{guild.name}</h2>
              <Link href="/dashboard" className="text-xs text-slate-400 hover:text-indigo-400">&larr; Serverlar ro'yxati</Link>
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            <Link href={`/dashboard/${guildId}`} className="block px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 font-medium">Umumiy ko'rinish</Link>
            <Link href={`/dashboard/${guildId}/automod`} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">AutoMod</Link>
            <Link href={`/dashboard/${guildId}/leveling`} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Leveling & XP</Link>
            <Link href={`/dashboard/${guildId}/cases`} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Moderatsiya</Link>
            <Link href={`/dashboard/${guildId}/settings`} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Server Sozlamalari</Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 text-xs text-slate-400">
          <p>Tizimga kirgan: <strong className="text-slate-200">{session.username}</strong></p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {ok && (
          <div className={`mb-6 p-4 rounded-xl border text-sm ${ok === 'true' ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' : 'bg-rose-950/40 border-rose-800/80 text-rose-300'}`}>
            {msg}
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">{guild.name} — Boshqaruv Paneli</h1>
            <p className="text-slate-400 text-sm">UzCord V2 server sozlamalarini bu yerdan boshqaring.</p>
          </div>
        </div>

        {/* Quick Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Moderatsiya Caselar</span>
            <div className="text-3xl font-bold text-slate-100 mt-2">{cases?.length ?? 0} ta</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Faol A'zolar (XP)</span>
            <div className="text-3xl font-bold text-slate-100 mt-2">{levels?.length ?? 0} ta</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Server Tili</span>
            <div className="text-3xl font-bold text-indigo-400 mt-2">{(guildSettings?.locale ?? 'uz').toUpperCase()}</div>
          </div>
        </div>

        {/* Action Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="font-semibold text-lg text-slate-200 mb-2">🛡️ AutoMod Sozlamalari</h3>
            <p className="text-slate-400 text-sm mb-4">Spam, takroriy xabarlar va taqiqlangan so'zlarni avtomatik moderatsiya qiling.</p>
            <Link href={`/dashboard/${guildId}/automod`} className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">AutoMod-ni sozlash &rarr;</Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="font-semibold text-lg text-slate-200 mb-2">⭐ Leveling & XP</h3>
            <p className="text-slate-400 text-sm mb-4">A'zolarga xabar uchun XP berish va avtomatik daraja rollarini belgilang.</p>
            <Link href={`/dashboard/${guildId}/leveling`} className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">Leveling-ni sozlash &rarr;</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
