import Link from 'next/link';
import { requireGuildAccess } from '@/lib/guard';
import { db } from '@/lib/supabase';
import { saveAutoModSettings, addFilteredWord, removeFilteredWord } from '@/lib/actions';

interface PageProps {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ ok?: string; msg?: string }>;
}

export default async function AutoModPage({ params, searchParams }: PageProps) {
  const { guildId } = await params;
  const { ok, msg } = await searchParams;
  const { session, guild } = await requireGuildAccess(guildId);

  const { data: settings } = await db
    .from('automod_settings')
    .select('*')
    .eq('guild_id', guildId)
    .single();

  const { data: words } = await db
    .from('filtered_words')
    .select('word')
    .eq('guild_id', guildId);

  const saveAction = saveAutoModSettings.bind(null, guildId);
  const addWordAction = addFilteredWord.bind(null, guildId);
  const removeWordAction = removeFilteredWord.bind(null, guildId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">{guild.name.slice(0, 2).toUpperCase()}</div>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-sm truncate">{guild.name}</h2>
              <Link href="/dashboard" className="text-xs text-slate-400 hover:text-indigo-400">&larr; Serverlar ro'yxati</Link>
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            <Link href={`/dashboard/${guildId}`} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Umumiy ko'rinish</Link>
            <Link href={`/dashboard/${guildId}/automod`} className="block px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-400 font-medium">AutoMod</Link>
            <Link href={`/dashboard/${guildId}/leveling`} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Leveling & XP</Link>
            <Link href={`/dashboard/${guildId}/cases`} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition">Moderatsiya</Link>
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-8 max-w-4xl overflow-y-auto">
        {ok && (
          <div className={`mb-6 p-4 rounded-xl border text-sm ${ok === 'true' ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' : 'bg-rose-950/40 border-rose-800/80 text-rose-300'}`}>
            {msg}
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-100 mb-2">🛡️ AutoMod Sozlamalari</h1>
        <p className="text-slate-400 text-sm mb-8">Serverdagi spam, invite va taqiqlangan so'zlarni avtomatik moderatsiya qiling.</p>

        <form action={saveAction} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-200">AutoMod tizimini yoqish</h3>
              <p className="text-xs text-slate-400">Barcha avtomatik filtrlar faollashadi.</p>
            </div>
            <input type="checkbox" name="enabled" defaultChecked={settings?.enabled ?? false} className="w-5 h-5 accent-indigo-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Spam limiti (xabar soni)</label>
              <input type="number" name="spam_limit" defaultValue={settings?.spam_limit ?? 5} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Spam oynasi (soniya)</label>
              <input type="number" name="spam_window_seconds" defaultValue={(settings?.spam_window_ms ?? 5000) / 1000} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200" />
            </div>
          </div>

          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition">Saqlash</button>
        </form>

        {/* Filtered Words List */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="font-semibold text-slate-200 mb-2">🤬 Taqiqlangan so'zlar</h3>
          <form action={addWordAction} className="flex gap-2 mb-4">
            <input type="text" name="word" placeholder="So'z kiriting..." required className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200" />
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm px-4 py-2.5 rounded-lg transition">Qo'shish</button>
          </form>

          <div className="flex flex-wrap gap-2">
            {words?.map((item) => (
              <form key={item.word} action={removeWordAction} className="inline-flex">
                <input type="hidden" name="word" value={item.word} />
                <button type="submit" className="bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs px-3 py-1.5 rounded-md transition border border-slate-700">
                  {item.word} &times;
                </button>
              </form>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
