import Link from 'next/link';
import { requireSession } from '@/lib/guard';

export default async function DashboardServerPicker() {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">U</div>
          <span className="font-semibold text-lg tracking-tight">UzCord Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            {session.avatar && (
              <img
                src={`https://cdn.discordapp.com/avatars/${session.userId}/${session.avatar}.png`}
                alt={session.username}
                className="w-7 h-7 rounded-full"
              />
            )}
            <span>{session.username}</span>
          </div>
          <a
            href="/api/auth/logout"
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-slate-300 transition"
          >
            Chiqish
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Serverni tanlang</h1>
          <p className="text-slate-400 text-sm">
            Siz boshqarish huquqiga ega bo'lgan Discord serverlaringiz ro'yxati.
          </p>
        </div>

        {session.guilds.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            Siz boshqara oladigan serverlar topilmadi. Discord serveringizda <strong>Manage Server</strong> ruxsatiga ega ekanligingizni tekshiring.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {session.guilds.map((guild) => {
              const iconUrl = guild.icon
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                : null;

              return (
                <Link
                  key={guild.id}
                  href={`/dashboard/${guild.id}`}
                  className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 p-5 rounded-xl transition flex items-center gap-4 group"
                >
                  {iconUrl ? (
                    <img src={iconUrl} alt={guild.name} className="w-12 h-12 rounded-full border border-slate-700 object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                      {guild.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h2 className="font-semibold text-slate-200 truncate group-hover:text-indigo-400 transition">
                      {guild.name}
                    </h2>
                    <span className="text-xs text-indigo-400/80 group-hover:underline">Boshqaruv paneli &rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
