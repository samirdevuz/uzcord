import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Card, PageHeader } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { db } from '@/lib/supabase';

export const metadata = { title: 'Transcript' };

export default async function TranscriptPage({ params }: { params: Promise<{ guildId: string; ticketId: string }> }) {
  const { guildId, ticketId } = await params;
  await requireGuildAccess(guildId);

  const id = Number.parseInt(ticketId, 10);
  if (!Number.isFinite(id)) notFound();

  // guild_id sharti shart — boshqa server murojaatini ID orqali ochib bo'lmasin.
  const { data } = await db
    .from('tickets')
    .select('ticket_number, opener_tag, closed_at, close_reason, transcript')
    .eq('guild_id', guildId)
    .eq('id', id)
    .maybeSingle();
  if (!data?.transcript) notFound();

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300"
        href={`/dashboard/${guildId}/tickets`}
      >
        <Icon className="h-3.5 w-3.5" name="arrowLeft" />
        Ticketlar
      </Link>
      <PageHeader
        actions={
          <a className="btn-ghost" href={`/api/guilds/${guildId}/tickets/${id}/transcript`}>
            <Icon className="h-4 w-4" name="external" />
            .txt yuklab olish
          </a>
        }
        description={`${data.opener_tag ?? 'Noma‘lum'} · yopilgan: ${formatDate(data.closed_at as string | null)}${data.close_reason ? ` · ${data.close_reason}` : ''}`}
        title={`Murojaat #${data.ticket_number}`}
      />
      <Card>
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-300">
          {data.transcript as string}
        </pre>
      </Card>
    </div>
  );
}
