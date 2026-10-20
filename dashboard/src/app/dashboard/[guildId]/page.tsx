import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Badge, Card, Empty, PageHeader, SaveButton, Stat, StatusBanner, Toggle } from '@/components/ui';
import { saveModules } from '@/lib/actions';
import { caseLabel, caseTone, formatDate, isModuleEnabled, MODULES } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { db } from '@/lib/supabase';

export const metadata = { title: 'Umumiy ko‘rinish' };

const AUDIT_LABELS: Record<string, string> = {
  'settings.update': 'umumiy sozlamalarni o‘zgartirdi',
  'modules.update': 'modullarni o‘zgartirdi',
  'automod.update': 'AutoMod sozlamalarini o‘zgartirdi',
  'automod.word.add': 'taqiqlangan so‘z qo‘shdi',
  'automod.word.remove': 'taqiqlangan so‘zni o‘chirdi',
  'case.deactivate': 'ogohlantirishni bekor qildi',
  'leveling.update': 'leveling sozlamalarini o‘zgartirdi',
  'leveling.reward.add': 'daraja mukofotini qo‘shdi',
  'leveling.reward.remove': 'daraja mukofotini o‘chirdi',
  'automod.lists': 'AutoMod istisnolarini o‘zgartirdi',
  'tickets.update': 'ticket sozlamalarini o‘zgartirdi',
  'starboard.update': 'starboard sozlamalarini o‘zgartirdi',
  'escalation.add': 'avtomatik jazo qoidasini qo‘shdi',
  'escalation.remove': 'avtomatik jazo qoidasini o‘chirdi',
};

/** Sozlash holati ro'yxatining bitta bandi. */
function SetupItem({ done, label, hint, href }: { done: boolean; label: string; hint: string; href: string }) {
  return (
    <Link
      className="group flex items-start gap-3 rounded-xl border border-ink-600 bg-ink-900/40 px-4 py-3 transition-colors hover:border-ink-500"
      href={href}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          done ? 'border-leaf/40 bg-leaf/15 text-leaf-light' : 'border-ink-400 text-transparent'
        }`}
      >
        <Icon className="h-3 w-3" name="check" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium ${done ? 'text-slate-400 line-through decoration-slate-600' : 'text-white'}`}>{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-slate-300" name="arrowRight" />
    </Link>
  );
}

async function count(table: string, apply: (query: any) => any): Promise<number> {
  const { count: total } = await apply(db.from(table).select('*', { count: 'exact', head: true }));
  return total ?? 0;
}

export default async function OverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  const { guildId } = await params;
  const { status, msg } = await searchParams;
  const { guild } = await requireGuildAccess(guildId);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [guildRow, totalCases, weekCases, activeWarns, words, recent, audit, automodRow, levelRow, ticketRow, starRow, escalations] =
    await Promise.all([
    db
      .from('guilds')
      .select('member_count, modules, mod_log_channel_id, welcome_channel_id')
      .eq('guild_id', guildId)
      .maybeSingle(),
    count('mod_cases', (q) => q.eq('guild_id', guildId)),
    count('mod_cases', (q) => q.eq('guild_id', guildId).gte('created_at', weekAgo)),
    count('mod_cases', (q) => q.eq('guild_id', guildId).eq('type', 'warn').eq('active', true)),
    count('filtered_words', (q) => q.eq('guild_id', guildId)),
    db
      .from('mod_cases')
      .select('case_number, type, user_tag, user_id, moderator_tag, created_at')
      .eq('guild_id', guildId)
      .order('case_number', { ascending: false })
      .limit(6),
    db
      .from('dashboard_audit')
      .select('id, actor_tag, action, created_at')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: false })
      .limit(6),
    db.from('automod_settings').select('enabled').eq('guild_id', guildId).maybeSingle(),
    db.from('level_settings').select('enabled').eq('guild_id', guildId).maybeSingle(),
    db.from('ticket_settings').select('enabled, panel_message_id').eq('guild_id', guildId).maybeSingle(),
    db.from('starboard_settings').select('enabled').eq('guild_id', guildId).maybeSingle(),
    count('escalations', (q) => q.eq('guild_id', guildId)),
  ]);

  const modules = guildRow.data?.modules;
  const memberCount = guildRow.data?.member_count as number | null | undefined;
  const base = `/dashboard/${guildId}`;
  const setup = [
    { done: Boolean(guildRow.data?.mod_log_channel_id), label: 'Moderatsiya logi', hint: 'Jazolar qayd etiladigan kanal', href: `${base}/settings` },
    { done: automodRow.data?.enabled === true, label: 'AutoMod', hint: 'Spam va reklamadan avtomatik himoya', href: `${base}/automod` },
    { done: escalations > 0, label: 'Avtomatik jazolar', hint: 'Masalan: 3-ogohlantirishda timeout', href: `${base}/escalations` },
    { done: Boolean(guildRow.data?.welcome_channel_id), label: 'Kutib olish', hint: 'Yangi a‘zolarga xush kelibsiz xabari', href: `${base}/settings` },
    { done: levelRow.data?.enabled === true, label: 'Leveling', hint: 'Faollik uchun XP va mukofot rollari', href: `${base}/leveling` },
    {
      done: Boolean(ticketRow.data?.enabled && ticketRow.data?.panel_message_id),
      label: 'Ticketlar',
      hint: 'Murojaat paneli joylangan',
      href: `${base}/tickets`,
    },
    { done: starRow.data?.enabled === true, label: 'Starboard', hint: 'Eng yaxshi xabarlar kanali', href: `${base}/starboard` },
  ];
  const doneCount = setup.filter((item) => item.done).length;

  return (
    <div className="space-y-6">
      <PageHeader description={`«${guild.name}» serveridagi bot faoliyati va modullar.`} title="Umumiy ko‘rinish" />
      <StatusBanner message={msg} status={status} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon="users" label="A‘zolar" value={memberCount ? memberCount.toLocaleString('uz-UZ') : '—'} />
        <Stat icon="clipboard" label="Jami case’lar" sub={`So‘nggi 7 kunda: ${weekCases}`} value={totalCases} />
        <Stat icon="alert" label="Faol ogohlantirish" value={activeWarns} />
        <Stat icon="type" label="Taqiqlangan so‘z" value={words} />
      </div>

      {doneCount < setup.length ? (
        <Card
          aside={<span className="shrink-0 text-sm tabular-nums text-slate-400">{doneCount} / {setup.length}</span>}
          description="Serverni to‘liq himoyalash va jonlantirish uchun qolgan qadamlar."
          icon="sparkles"
          title="Sozlash holati"
        >
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-ink-600">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-leaf"
              style={{ width: `${Math.round((doneCount / setup.length) * 100)}%` }}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {setup.map((item) => (
              <SetupItem key={item.label} {...item} />
            ))}
          </div>
        </Card>
      ) : null}

      <form action={saveModules.bind(null, guildId)}>
        <Card
          description="O‘chirilgan modul botda butunlay ishlamaydi. O‘zgarish botga 1 daqiqa ichida yetadi."
          footer={<SaveButton />}
          icon="layers"
          title="Modullar"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {MODULES.map((module) => (
              <Toggle
                key={module.name}
                defaultChecked={isModuleEnabled(modules, module.name)}
                hint={module.hint}
                label={module.label}
                name={`module_${module.name}`}
              />
            ))}
          </div>
        </Card>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          aside={
            <Link
              className="inline-flex shrink-0 items-center gap-1 text-sm text-brand-light hover:text-white"
              href={`/dashboard/${guildId}/cases`}
            >
              Barchasi
              <Icon className="h-3.5 w-3.5" name="arrowRight" />
            </Link>
          }
          icon="clipboard"
          title="So‘nggi case’lar"
        >
          {(recent.data ?? []).length === 0 ? (
            <Empty icon="shieldCheck">Hali moderatsiya amallari yo‘q.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-ink-600/70 text-sm">
              {(recent.data ?? []).map((item) => (
                <li key={item.case_number as number} className="flex items-center gap-3 py-3">
                  <span className="w-10 shrink-0 font-mono text-xs text-slate-500">#{item.case_number as number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-slate-200">{(item.user_tag as string | null) ?? (item.user_id as string)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {(item.moderator_tag as string | null) ?? 'Noma‘lum'} · {formatDate(item.created_at as string)}
                    </p>
                  </div>
                  <Badge className={caseTone(item.type as string)}>{caseLabel(item.type as string)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card description="Panel orqali kiritilgan o‘zgarishlar" icon="list" title="Audit jurnali">
          {(audit.data ?? []).length === 0 ? (
            <Empty icon="list">Hali o‘zgarishlar yo‘q.</Empty>
          ) : (
            <ol className="relative -my-1 space-y-4 border-l border-ink-600 pl-5">
              {(audit.data ?? []).map((item) => (
                <li key={item.id as number} className="relative text-sm">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border-2 border-ink-800 bg-brand" />
                  <p className="text-slate-300">
                    <span className="font-medium text-white">{(item.actor_tag as string | null) ?? 'Noma‘lum'}</span>{' '}
                    {AUDIT_LABELS[item.action as string] ?? (item.action as string)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDate(item.created_at as string)}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
