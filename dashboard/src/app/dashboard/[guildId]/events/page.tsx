import { Badge, Card, Empty, Notice, PageHeader, Stat } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { db } from '@/lib/supabase';

export const metadata = { title: 'Tadbirlar' };

const ACTIVE = 'border-leaf/30 bg-leaf/10 text-leaf-light';
const ENDED = 'border-ink-500 bg-ink-700 text-slate-400';

function jump(guildId: string, channelId: string, messageId: string | null): string | null {
  return messageId ? `https://discord.com/channels/${guildId}/${channelId}/${messageId}` : null;
}

export default async function EventsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  await requireGuildAccess(guildId);

  const [{ data: giveawayRows }, { data: pollRows }] = await Promise.all([
    db
      .from('giveaways')
      .select('id, channel_id, message_id, prize, winner_count, ends_at, ended, winners, giveaway_entries(count)')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('polls')
      .select('id, channel_id, message_id, question, options, multi, ends_at, ended, poll_votes(count)')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  type Counted = { count: number }[] | null;
  const giveaways = (giveawayRows ?? []) as {
    id: number;
    channel_id: string;
    message_id: string | null;
    prize: string;
    winner_count: number;
    ends_at: string;
    ended: boolean;
    winners: string[] | null;
    giveaway_entries: Counted;
  }[];
  const polls = (pollRows ?? []) as {
    id: number;
    channel_id: string;
    message_id: string | null;
    question: string;
    options: { label: string }[];
    multi: boolean;
    ends_at: string | null;
    ended: boolean;
    poll_votes: Counted;
  }[];

  const activeGiveaways = giveaways.filter((item) => !item.ended).length;
  const activePolls = polls.filter((item) => !item.ended).length;

  return (
    <div className="space-y-6">
      <PageHeader description="Serverdagi konkurslar va so‘rovnomalar. Ular Discord’da yaratiladi va boshqariladi." title="Tadbirlar" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon="sparkles" label="Faol konkurslar" value={activeGiveaways} />
        <Stat icon="sparkles" label="Jami konkurslar" value={giveaways.length} />
        <Stat icon="list" label="Faol so‘rovnomalar" value={activePolls} />
        <Stat icon="list" label="Jami so‘rovnomalar" value={polls.length} />
      </div>

      <Notice>
        Yaratish: <code>/giveaway create</code> va <code>/poll</code>. Muddati tugaganda bot ularni avtomatik yakunlaydi va
        natijani e‘lon qiladi.
      </Notice>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card icon="sparkles" title="Konkurslar">
          {giveaways.length === 0 ? (
            <Empty icon="sparkles">Hali konkurslar yo‘q.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-ink-600/70 text-sm">
              {giveaways.map((item) => {
                const link = jump(guildId, item.channel_id, item.message_id);
                const entries = item.giveaway_entries?.[0]?.count ?? 0;
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      {link ? (
                        <a className="block truncate font-medium text-slate-100 hover:text-brand-light" href={link} rel="noreferrer" target="_blank">
                          🎉 {item.prize}
                        </a>
                      ) : (
                        <span className="block truncate font-medium text-slate-100">🎉 {item.prize}</span>
                      )}
                      <span className="block text-xs text-slate-500">
                        {entries} ishtirokchi · {item.winner_count} g‘olib ·{' '}
                        {item.ended ? `g‘oliblar: ${(item.winners ?? []).length}` : `tugaydi: ${formatDate(item.ends_at)}`}
                      </span>
                    </div>
                    <Badge className={item.ended ? ENDED : ACTIVE}>{item.ended ? 'Yakunlangan' : 'Faol'}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card icon="list" title="So‘rovnomalar">
          {polls.length === 0 ? (
            <Empty icon="list">Hali so‘rovnomalar yo‘q.</Empty>
          ) : (
            <ul className="-my-2 divide-y divide-ink-600/70 text-sm">
              {polls.map((item) => {
                const link = jump(guildId, item.channel_id, item.message_id);
                const votes = item.poll_votes?.[0]?.count ?? 0;
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      {link ? (
                        <a className="block truncate font-medium text-slate-100 hover:text-brand-light" href={link} rel="noreferrer" target="_blank">
                          📊 {item.question}
                        </a>
                      ) : (
                        <span className="block truncate font-medium text-slate-100">📊 {item.question}</span>
                      )}
                      <span className="block text-xs text-slate-500">
                        {item.options?.length ?? 0} variant · {votes} ovoz · {item.multi ? 'ko‘p tanlov' : 'bitta tanlov'}
                        {item.ends_at && !item.ended ? ` · tugaydi: ${formatDate(item.ends_at)}` : ''}
                      </span>
                    </div>
                    <Badge className={item.ended ? ENDED : ACTIVE}>{item.ended ? 'Yakunlangan' : 'Faol'}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
