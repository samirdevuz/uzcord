import Link from 'next/link';
import { ChannelSelect, MultiPicker } from '@/components/pickers';
import { Badge, Card, Empty, Field, Notice, PageHeader, Stat, StatusBanner, StickySave, TextArea, Toggle } from '@/components/ui';
import { saveTicketSettings } from '@/lib/actions';
import { formatDate } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { CHANNEL_TYPE, getGuildStructure } from '@/lib/structure';
import { asList, db } from '@/lib/supabase';

export const metadata = { title: 'Ticketlar' };

const STATUS: Record<string, { label: string; tone: string }> = {
  open: { label: 'Ochiq', tone: 'border-leaf/30 bg-leaf/10 text-leaf-light' },
  claimed: { label: 'Ko‘rilmoqda', tone: 'border-brand/30 bg-brand/10 text-brand-light' },
  closed: { label: 'Yopilgan', tone: 'border-ink-500 bg-ink-700 text-slate-400' },
};

interface TicketRow {
  id: number;
  ticket_number: number;
  opener_id: string;
  opener_tag: string | null;
  status: string;
  claimed_by: string | null;
  close_reason: string | null;
  message_count: number;
  created_at: string;
  closed_at: string | null;
  has_transcript: boolean;
}

async function count(guildId: string, status?: string): Promise<number> {
  let query = db.from('tickets').select('id', { count: 'exact', head: true }).eq('guild_id', guildId);
  if (status === 'closed') query = query.eq('status', 'closed');
  else if (status === 'active') query = query.neq('status', 'closed');
  const { count: total } = await query;
  return total ?? 0;
}

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  const { guildId } = await params;
  const { status, msg } = await searchParams;
  await requireGuildAccess(guildId);

  const [{ data: row }, { data: ticketRows }, structure, total, active] = await Promise.all([
    db.from('ticket_settings').select('*').eq('guild_id', guildId).maybeSingle(),
    db
      .from('tickets')
      .select('id, ticket_number, opener_id, opener_tag, status, claimed_by, close_reason, message_count, created_at, closed_at')
      .eq('guild_id', guildId)
      .order('ticket_number', { ascending: false })
      .limit(30),
    getGuildStructure(guildId),
    count(guildId),
    count(guildId, 'active'),
  ]);

  const settings = (row ?? {}) as Record<string, unknown>;
  const tickets: TicketRow[] = (ticketRows ?? []).map((ticket) => ({
    ...(ticket as unknown as TicketRow),
    // Bot yopgan har bir murojaatda transcript saqlanadi; matnning o'zini ro'yxatda yuklamaymiz.
    has_transcript: ticket.status === 'closed' && Boolean(ticket.closed_at),
  }));
  const str = (key: string) => (settings[key] as string | null | undefined) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader description="A‘zolar tugma bosib moderatorlarga yopiq kanal orqali murojaat qiladi." title="Ticketlar" />
      <StatusBanner message={msg} status={status} />

      <div className="grid grid-cols-3 gap-4">
        <Stat icon="clipboard" label="Jami murojaat" value={total} />
        <Stat icon="info" label="Ochiq" value={active} />
        <Stat icon="check" label="Yopilgan" value={total - active} />
      </div>

      <Notice>
        Sozlagandan keyin murojaat panelini Discord’da joylang: <code>/ticket panel channel:#kanal</code>. Murojaat
        kanalida <code>/ticket close</code>, <code>/ticket add</code>, <code>/ticket remove</code> ishlaydi.
      </Notice>

      <form action={saveTicketSettings.bind(null, guildId)} className="space-y-6">
        <Card icon="sliders" title="Sozlamalar">
          <div className="space-y-5">
            <Toggle defaultChecked={settings.enabled === true} label="Murojaat tizimi yoqilgan" name="enabled" />
            <div className="grid gap-4 sm:grid-cols-2">
              <ChannelSelect
                channels={structure.channels}
                defaultValue={str('category_id')}
                emptyLabel="— kategoriyasiz —"
                hint="Yangi murojaat kanallari shu kategoriyada ochiladi"
                label="Kategoriya"
                name="category_id"
                types={[CHANNEL_TYPE.category]}
              />
              <ChannelSelect
                channels={structure.channels}
                defaultValue={str('transcript_channel_id')}
                emptyLabel="— yuborilmaydi —"
                hint="Yopilgan murojaatlar yozishmasi shu kanalga yuboriladi"
                label="Transcript kanali"
                name="transcript_channel_id"
              />
            </div>
            <MultiPicker
              hint="Bu rollar barcha murojaatlarni ko‘radi, oladi va yopadi. «Kanallarni boshqarish» ruxsati borlar ham."
              items={structure.roles.filter((role) => !role.managed)}
              kind="role"
              label="Support rollari"
              name="support_role_ids"
              selected={asList(settings.support_role_ids)}
            />
            <div className="w-full sm:w-64">
              <Field
                defaultValue={(settings.max_open_per_user as number | undefined) ?? 1}
                hint="Bir a‘zo bir vaqtda nechta murojaat ochishi mumkin"
                label="Ochiq murojaatlar chegarasi"
                max={5}
                min={1}
                name="max_open_per_user"
                type="number"
              />
            </div>
          </div>
        </Card>

        <Card description="Panel matnlari keyingi /ticket panel da qo‘llanadi." icon="type" title="Matnlar">
          <div className="space-y-4">
            <Field defaultValue={str('panel_title') ?? 'Yordam kerakmi?'} label="Panel sarlavhasi" name="panel_title" />
            <TextArea
              defaultValue={str('panel_description') ?? 'Quyidagi tugmani bosib moderatorlarga murojaat qiling.'}
              label="Panel matni"
              name="panel_description"
            />
            <TextArea
              defaultValue={str('open_message') ?? 'Salom {user}! Muammoingizni batafsil yozing, moderatorlar tez orada javob beradi.'}
              hint="{user} — murojaat egasi"
              label="Yangi murojaatdagi xabar"
              name="open_message"
            />
          </div>
        </Card>

        <StickySave note="Sozlamalar keyingi murojaatdan boshlab qo‘llanadi." />
      </form>

      <Card icon="clipboard" title="Oxirgi murojaatlar">
        {tickets.length === 0 ? (
          <Empty icon="clipboard">Hali murojaatlar yo‘q.</Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-y border-ink-600 bg-ink-900/40 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium sm:pl-6">#</th>
                  <th className="px-3 py-2.5 font-medium">Murojaatchi</th>
                  <th className="px-3 py-2.5 font-medium">Holati</th>
                  <th className="px-3 py-2.5 font-medium">Xabarlar</th>
                  <th className="px-3 py-2.5 font-medium">Ochilgan</th>
                  <th className="px-5 py-2.5 font-medium sm:pr-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-600/70">
                {tickets.map((ticket) => {
                  const state = STATUS[ticket.status] ?? STATUS.closed;
                  return (
                    <tr key={ticket.id} className="hover:bg-ink-700/30">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 sm:pl-6">{ticket.ticket_number}</td>
                      <td className="px-3 py-3">
                        <span className="text-slate-200">{ticket.opener_tag ?? 'Noma‘lum'}</span>
                        <span className="block font-mono text-xs text-slate-500">{ticket.opener_id}</span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={state.tone}>{state.label}</Badge>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-400">{ticket.status === 'closed' ? ticket.message_count : '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">{formatDate(ticket.created_at)}</td>
                      <td className="px-5 py-3 text-right sm:pr-6">
                        {ticket.has_transcript ? (
                          <Link className="text-sm text-brand-light hover:text-white" href={`/dashboard/${guildId}/tickets/${ticket.id}`}>
                            Transcript
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
