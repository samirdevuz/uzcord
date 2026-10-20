import { ChannelSelect, MultiPicker } from '@/components/pickers';
import { Card, Empty, Field, PageHeader, SaveButton, Stat, StatusBanner, Toggle } from '@/components/ui';
import { saveStarboardSettings } from '@/lib/actions';
import { formatDate } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { getGuildStructure, TEXT_TYPES } from '@/lib/structure';
import { asList, db } from '@/lib/supabase';

export const metadata = { title: 'Starboard' };

export default async function StarboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  const { guildId } = await params;
  const { status, msg } = await searchParams;
  await requireGuildAccess(guildId);

  const [{ data: row }, { data: posts, count }, structure] = await Promise.all([
    db.from('starboard_settings').select('*').eq('guild_id', guildId).maybeSingle(),
    db
      .from('starboard_posts')
      .select('source_message_id, source_channel_id, author_id, star_count, created_at', { count: 'exact' })
      .eq('guild_id', guildId)
      .order('star_count', { ascending: false })
      .limit(10),
    getGuildStructure(guildId),
  ]);

  const settings = (row ?? {}) as Record<string, unknown>;
  const channelName = new Map(structure.channels.map((channel) => [channel.id, channel.name]));
  const textChannels = structure.channels.filter((channel) => TEXT_TYPES.includes(channel.type));
  const top = (posts ?? []) as { source_message_id: string; source_channel_id: string; author_id: string | null; star_count: number; created_at: string }[];

  return (
    <div className="space-y-6">
      <PageHeader
        description="Belgilangan emoji bilan ko‘p reaksiya olgan xabarlar alohida «faxriy» kanalga chiqariladi."
        title="Starboard"
      />
      <StatusBanner message={msg} status={status} />

      <div className="grid grid-cols-2 gap-4">
        <Stat icon="sparkles" label="Starboardga chiqqan" value={count ?? 0} />
        <Stat icon="zap" label="Eng ko‘p yulduz" value={top[0]?.star_count ?? 0} />
      </div>

      <form action={saveStarboardSettings.bind(null, guildId)}>
        <Card footer={<SaveButton />} icon="sliders" title="Sozlamalar">
          <div className="space-y-5">
            <Toggle defaultChecked={settings.enabled === true} label="Starboard yoqilgan" name="enabled" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <ChannelSelect
                  channels={structure.channels}
                  defaultValue={(settings.channel_id as string | null) ?? null}
                  label="Starboard kanali"
                  name="channel_id"
                />
              </div>
              <Field defaultValue={(settings.emoji as string | undefined) ?? '⭐'} hint="Unicode yoki <:nom:id>" label="Emoji" name="emoji" />
              <Field
                defaultValue={(settings.threshold as number | undefined) ?? 3}
                hint="Shuncha reaksiyada chiqadi"
                label="Chegara"
                max={100}
                min={1}
                name="threshold"
                type="number"
              />
              <div className="sm:pt-7">
                <Toggle defaultChecked={settings.allow_self_star === true} label="O‘ziga ovoz" name="allow_self_star" />
              </div>
            </div>
            <MultiPicker
              items={textChannels}
              kind="channel"
              label="E‘tiborsiz kanallar"
              name="ignored_channels"
              selected={asList(settings.ignored_channels)}
            />
          </div>
        </Card>
      </form>

      <Card icon="sparkles" title="Eng ko‘p yulduz olganlar">
        {top.length === 0 ? (
          <Empty icon="sparkles">Hali starboardga chiqqan xabar yo‘q.</Empty>
        ) : (
          <ol className="-my-2 divide-y divide-ink-600/70 text-sm">
            {top.map((post) => (
              <li key={post.source_message_id} className="flex items-center gap-3 py-2.5">
                <span className="w-14 shrink-0 font-semibold tabular-nums text-amber-300">⭐ {post.star_count}</span>
                <a
                  className="min-w-0 flex-1 truncate text-slate-200 hover:text-brand-light"
                  href={`https://discord.com/channels/${guildId}/${post.source_channel_id}/${post.source_message_id}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  #{channelName.get(post.source_channel_id) ?? post.source_channel_id}
                  <span className="text-slate-500"> · {post.author_id ?? '—'}</span>
                </a>
                <span className="shrink-0 text-xs text-slate-500">{formatDate(post.created_at)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
