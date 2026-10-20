import { Icon } from '@/components/icons';
import { Badge, Card, Empty, Field, PageHeader, Select, StatusBanner } from '@/components/ui';
import { addEscalation, removeEscalation } from '@/lib/actions';
import { formatDuration } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { db } from '@/lib/supabase';

export const metadata = { title: 'Avtomatik jazolar' };

const ACTIONS: Record<string, { label: string; tone: string }> = {
  timeout: { label: 'Timeout', tone: 'border-violet-800/60 bg-violet-950/40 text-violet-300' },
  kick: { label: 'Kick', tone: 'border-amber-800/60 bg-amber-950/40 text-amber-300' },
  ban: { label: 'Ban', tone: 'border-red-800/60 bg-red-950/50 text-red-300' },
};

export default async function EscalationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  const { guildId } = await params;
  const { status, msg } = await searchParams;
  await requireGuildAccess(guildId);

  const { data } = await db
    .from('escalations')
    .select('warn_count, action, duration_ms')
    .eq('guild_id', guildId)
    .order('warn_count', { ascending: true });
  const rules = (data ?? []) as { warn_count: number; action: string; duration_ms: number | null }[];

  return (
    <div className="space-y-6">
      <PageHeader
        description="A‘zo belgilangan miqdorda faol ogohlantirish to‘plaganda bot avtomatik jazo beradi — qo‘lda ham, AutoMod orqali ham."
        title="Avtomatik jazolar"
      />
      <StatusBanner message={msg} status={status} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <form action={addEscalation.bind(null, guildId)}>
            <Card description="Shu sondagi ogohlantirish uchun mavjud qoida almashtiriladi." icon="plus" title="Qoida qo‘shish">
              <div className="space-y-4">
                <Field label="Ogohlantirishlar soni" max={50} min={1} name="warn_count" placeholder="3" type="number" />
                <Select
                  defaultValue="timeout"
                  label="Jazo"
                  name="action"
                  options={[
                    { value: 'timeout', label: 'Timeout' },
                    { value: 'kick', label: 'Kick' },
                    { value: 'ban', label: 'Ban' },
                  ]}
                />
                <Field
                  hint="Timeout uchun majburiy (ko‘pi bilan 40320 = 28 kun). Ban uchun 0 = doimiy. Kick uchun e‘tiborga olinmaydi."
                  label="Muddat (daqiqa)"
                  max={525600}
                  min={0}
                  name="duration_minutes"
                  placeholder="60"
                  type="number"
                />
                <button className="btn-primary w-full" type="submit">
                  <Icon className="h-4 w-4" name="plus" />
                  Qo‘shish
                </button>
              </div>
            </Card>
          </form>
        </div>

        <div className="lg:col-span-3">
          <Card icon="zap" title="Faol qoidalar">
            {rules.length === 0 ? (
              <Empty icon="zap">Qoidalar yo‘q — ogohlantirishlar faqat qayd etiladi.</Empty>
            ) : (
              <ol className="relative space-y-3 border-l border-ink-600 pl-6">
                {rules.map((rule) => {
                  const action = ACTIONS[rule.action] ?? ACTIONS.timeout;
                  const duration =
                    rule.action === 'kick'
                      ? null
                      : rule.duration_ms
                        ? formatDuration(rule.duration_ms)
                        : rule.action === 'ban'
                          ? 'doimiy'
                          : '1 soat';
                  return (
                    <li key={rule.warn_count} className="relative flex items-center gap-3 rounded-xl border border-ink-600 bg-ink-900/40 px-4 py-3">
                      <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink-800 bg-brand text-[10px] font-bold text-ink-950">
                        {rule.warn_count}
                      </span>
                      <span className="text-sm text-slate-300">
                        <strong className="text-white">{rule.warn_count}</strong>-ogohlantirishda
                      </span>
                      <Badge className={action.tone}>{action.label}</Badge>
                      {duration ? <span className="text-xs text-slate-500">{duration}</span> : null}
                      <form action={removeEscalation.bind(null, guildId)} className="ml-auto">
                        <input name="warn_count" type="hidden" value={rule.warn_count} />
                        <button
                          aria-label={`${rule.warn_count}-ogohlantirish qoidasini o‘chirish`}
                          className="rounded p-1 text-slate-500 hover:bg-red-950/50 hover:text-red-300"
                          type="submit"
                        >
                          <Icon className="h-4 w-4" name="x" />
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
