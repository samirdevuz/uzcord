import Link from 'next/link';
import { Icon } from '@/components/icons';
import { Badge, Card, Empty, Notice, PageHeader, StatusBanner } from '@/components/ui';
import { deactivateCase } from '@/lib/actions';
import { caseLabel, CASE_LABELS, CASE_TYPES, caseTone, formatDate, formatDuration, isCaseType } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { db, dbErrorMessage } from '@/lib/supabase';

export const metadata = { title: 'Moderatsiya tarixi' };

const PAGE_SIZE = 25;

interface CaseRow {
  case_number: number;
  type: string;
  user_id: string;
  user_tag: string | null;
  moderator_id: string;
  moderator_tag: string | null;
  reason: string | null;
  duration_ms: number | null;
  active: boolean;
  created_at: string;
}

export default async function CasesPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{
    status?: string;
    msg?: string;
    type?: string;
    user?: string;
    active?: string;
    page?: string;
  }>;
}) {
  const { guildId } = await params;
  const query = await searchParams;
  await requireGuildAccess(guildId);

  // Filtrlar — faqat tekshirilgan qiymatlar so'rovga tushadi.
  const type = query.type && isCaseType(query.type) ? query.type : '';
  const user = (query.user ?? '').replace(/\D/g, '').slice(0, 21);
  const activeOnly = query.active === 'on';
  const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let request = db
    .from('mod_cases')
    .select(
      'case_number, type, user_id, user_tag, moderator_id, moderator_tag, reason, duration_ms, active, created_at',
      { count: 'exact' }
    )
    .eq('guild_id', guildId)
    .order('case_number', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (type) request = request.eq('type', type);
  if (user) request = request.eq('user_id', user);
  if (activeOnly) request = request.eq('active', true);

  const { data, count, error } = await request;
  const cases = (data ?? []) as CaseRow[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (target: number) => {
    const search = new URLSearchParams();
    if (type) search.set('type', type);
    if (user) search.set('user', user);
    if (activeOnly) search.set('active', 'on');
    search.set('page', String(target));
    return `/dashboard/${guildId}/cases?${search.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        description="Botdagi barcha moderatsiya amallari: qo‘lda va AutoMod tomonidan berilgan jazolar."
        title="Moderatsiya tarixi"
      />
      <StatusBanner message={query.msg} status={query.status} />

      <section className="card !p-4">
        {/* GET form — filtrlar URL'da qoladi, sahifani ulashish mumkin. */}
        <form className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.3fr_auto_auto]" method="get">
          <div>
            <label className="label" htmlFor="type">
              Turi
            </label>
            <select className="input" defaultValue={type} id="type" name="type">
              <option value="">Hammasi</option>
              {CASE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {CASE_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="user">
              Foydalanuvchi IDsi
            </label>
            <input className="input" defaultValue={user} id="user" inputMode="numeric" name="user" placeholder="123456789012345678" />
          </div>
          <label className="flex h-[42px] items-center gap-2 whitespace-nowrap text-sm text-slate-300" htmlFor="active">
            <input className="h-4 w-4 accent-brand" defaultChecked={activeOnly} id="active" name="active" type="checkbox" />
            Faqat faollari
          </label>
          <div className="flex gap-2">
            <button className="btn-primary" type="submit">
              <Icon className="h-4 w-4" name="search" />
              Qidirish
            </button>
            <Link className="btn-ghost" href={`/dashboard/${guildId}/cases`}>
              Tozalash
            </Link>
          </div>
        </form>
      </section>

      <Card icon="clipboard" title={`Case’lar (${total.toLocaleString('uz-UZ')})`}>
        {error ? (
          <Notice tone="error">{dbErrorMessage(error)}</Notice>
        ) : cases.length === 0 ? (
          <Empty icon="search">Hech narsa topilmadi.</Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-y border-ink-600 bg-ink-900/40 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium sm:pl-6">#</th>
                  <th className="px-3 py-2.5 font-medium">Turi</th>
                  <th className="px-3 py-2.5 font-medium">Foydalanuvchi</th>
                  <th className="px-3 py-2.5 font-medium">Moderator</th>
                  <th className="px-3 py-2.5 font-medium">Sabab</th>
                  <th className="px-3 py-2.5 font-medium">Sana</th>
                  <th className="px-5 py-2.5 font-medium sm:pr-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-600/70">
                {cases.map((item) => (
                  <tr
                    key={item.case_number}
                    className={`transition-colors hover:bg-ink-700/30 ${item.active ? '' : 'opacity-50'}`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 sm:pl-6">{item.case_number}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <Badge className={caseTone(item.type)}>{caseLabel(item.type)}</Badge>
                      {item.duration_ms ? (
                        <span className="mt-1 block text-xs text-slate-500">{formatDuration(item.duration_ms)}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        className="text-slate-200 hover:text-brand-light"
                        href={`/dashboard/${guildId}/cases?user=${item.user_id}`}
                      >
                        {item.user_tag ?? 'Noma‘lum'}
                      </Link>
                      <span className="block font-mono text-xs text-slate-500">{item.user_id}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{item.moderator_tag ?? item.moderator_id}</td>
                    <td className="max-w-xs px-3 py-3 text-slate-400">
                      <span className="line-clamp-2 break-words">{item.reason ?? '—'}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right sm:pr-6">
                      {/* Faqat ogohlantirishni bekor qilish ma'noli: u eskalatsiya
                          hisobidan chiqadi. Banni bekor qilish uchun /unban kerak. */}
                      {item.type === 'warn' && item.active ? (
                        <form action={deactivateCase.bind(null, guildId)}>
                          <input name="case_number" type="hidden" value={item.case_number} />
                          <button className="btn-danger whitespace-nowrap px-3 py-1 text-xs" type="submit">
                            Bekor qilish
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 ? (
          <div className="mt-5 flex items-center justify-between text-sm">
            {page > 1 ? (
              <Link className="btn-ghost" href={pageHref(page - 1)}>
                <Icon className="h-4 w-4" name="arrowLeft" />
                Oldingi
              </Link>
            ) : (
              <span />
            )}
            <span className="tabular-nums text-slate-500">
              {page} / {pages}
            </span>
            {page < pages ? (
              <Link className="btn-ghost" href={pageHref(page + 1)}>
                Keyingi
                <Icon className="h-4 w-4" name="arrowRight" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
