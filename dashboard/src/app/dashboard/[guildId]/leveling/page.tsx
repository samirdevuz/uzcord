import { Card, Empty, Field, Notice, PageHeader, SaveButton, StatusBanner, TextArea, Toggle } from '@/components/ui';
import { saveLevelSettings } from '@/lib/actions';
import { LEVEL_DEFAULTS, type LevelRow } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { db } from '@/lib/supabase';

export const metadata = { title: 'Leveling' };

interface MemberRow {
  user_id: string;
  user_tag: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  messages: number;
}

export default async function LevelingPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  const { guildId } = await params;
  const { status, msg } = await searchParams;
  await requireGuildAccess(guildId);

  const [{ data: row }, { data: memberRows }, { data: rewardRows }] = await Promise.all([
    db.from('level_settings').select('*').eq('guild_id', guildId).maybeSingle(),
    db
      .from('member_levels')
      .select('user_id, user_tag, avatar, xp, level, messages')
      .eq('guild_id', guildId)
      .order('xp', { ascending: false })
      .limit(25),
    db
      .from('level_rewards')
      .select('level, role_id')
      .eq('guild_id', guildId)
      .order('level', { ascending: true }),
  ]);

  const settings: LevelRow = { ...LEVEL_DEFAULTS, ...((row ?? {}) as Partial<LevelRow>) };
  const members = (memberRows ?? []) as MemberRow[];
  const rewards = (rewardRows ?? []) as { level: number; role_id: string }[];

  return (
    <div className="space-y-6">
      <PageHeader description="Faol a‘zolar xabar yozib XP to‘playdi va darajasi oshadi." title="Leveling" />
      <StatusBanner message={msg} status={status} />

      <Notice tone="info">
        Sozlamalar botga 1 daqiqa ichida yetadi. Daraja mukofotlari (rollar) Discord’da sozlanadi:{' '}
        <code>/level reward-add</code>.
      </Notice>

      <form action={saveLevelSettings.bind(null, guildId)}>
        <Card footer={<SaveButton />} icon="sliders" title="Sozlamalar">
          <div className="space-y-4">
            <Toggle defaultChecked={settings.enabled} label="Leveling yoqilgan" name="enabled" />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field defaultValue={settings.xp_min} hint="1–500" label="Minimal XP" max={500} min={1} name="xp_min" type="number" />
              <Field defaultValue={settings.xp_max} hint="Minimaldan kam bo‘lmaydi" label="Maksimal XP" max={500} min={1} name="xp_max" type="number" />
              <Field defaultValue={settings.cooldown_seconds} hint="Har xabar uchun emas — shu oraliqda bir marta" label="Kutish (soniya)" max={3600} min={0} name="cooldown_seconds" type="number" />
            </div>

            <Toggle
              defaultChecked={settings.announce_enabled}
              label="Yangi daraja haqida e‘lon qilish"
              name="announce_enabled"
            />
            <Field
              defaultValue={settings.announce_channel_id}
              hint="Bo‘sh = xabar yozilgan kanalning o‘zida"
              label="E‘lon kanali"
              name="announce_channel_id"
              placeholder="Kanal IDsi"
            />
            <TextArea
              defaultValue={settings.level_up_message}
              hint="O‘zgaruvchilar: {user}, {level}"
              label="E‘lon matni"
              name="level_up_message"
            />
            <Toggle
              defaultChecked={settings.stack_rewards}
              hint="O‘chiq bo‘lsa faqat eng yuqori darajadagi mukofot roli qoladi"
              label="Mukofot rollarini to‘plash"
              name="stack_rewards"
            />
          </div>
        </Card>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card icon="trending" title="Reyting (top 25)">
            {members.length === 0 ? (
              <Empty icon="trending">Hali hech kim XP to‘plamagan.</Empty>
            ) : (
              <ol className="-my-2 divide-y divide-ink-600/70 text-sm">
                {members.map((member, index) => (
                  <li key={member.user_id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs ${
                        index === 0
                          ? 'bg-brand/20 text-brand-light'
                          : index < 3
                            ? 'bg-ink-600 text-slate-200'
                            : 'text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    {member.avatar ? (
                      <img alt="" className="h-7 w-7 rounded-full" src={member.avatar} />
                    ) : (
                      <span className="h-7 w-7 rounded-full bg-ink-600" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-slate-200">
                      {member.user_tag ?? member.user_id}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {Number(member.xp).toLocaleString('uz-UZ')} XP
                    </span>
                    <span className="w-16 shrink-0 text-right font-medium text-brand-light">
                      {member.level}-daraja
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <Card icon="sparkles" title="Mukofot rollari">
          {rewards.length === 0 ? (
            <Empty>Mukofotlar yo‘q.</Empty>
          ) : (
            <ul className="divide-y divide-ink-600 text-sm">
              {rewards.map((reward) => (
                <li key={reward.level} className="flex justify-between py-2">
                  <span className="text-slate-300">{reward.level}-daraja</span>
                  <code className="text-xs text-slate-500">@{reward.role_id}</code>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
