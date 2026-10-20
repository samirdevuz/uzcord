import { Icon } from '@/components/icons';
import { ChannelSelect, MultiPicker, RoleSelect } from '@/components/pickers';
import { Card, Empty, Field, Notice, PageHeader, SaveButton, StatusBanner, TextArea, Toggle } from '@/components/ui';
import { addLevelReward, removeLevelReward, saveLevelSettings } from '@/lib/actions';
import { LEVEL_DEFAULTS, type LevelRow } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { getGuildStructure, roleColor, TEXT_TYPES } from '@/lib/structure';
import { asList, db } from '@/lib/supabase';

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

  const [{ data: row }, { data: memberRows }, { data: rewardRows }, structure] = await Promise.all([
    db.from('level_settings').select('*').eq('guild_id', guildId).maybeSingle(),
    db
      .from('member_levels')
      .select('user_id, user_tag, avatar, xp, level, messages')
      .eq('guild_id', guildId)
      .order('xp', { ascending: false })
      .limit(25),
    db.from('level_rewards').select('level, role_id').eq('guild_id', guildId).order('level', { ascending: true }),
    getGuildStructure(guildId),
  ]);

  const raw = (row ?? {}) as Record<string, unknown>;
  const settings: LevelRow = { ...LEVEL_DEFAULTS, ...(raw as Partial<LevelRow>) };
  const members = (memberRows ?? []) as MemberRow[];
  const rewards = (rewardRows ?? []) as { level: number; role_id: string }[];
  const roleById = new Map(structure.roles.map((role) => [role.id, role]));
  const textChannels = structure.channels.filter((channel) => TEXT_TYPES.includes(channel.type));

  return (
    <div className="space-y-6">
      <PageHeader description="Faol a‘zolar xabar yozib XP to‘playdi, darajasi oshadi va mukofot rollarini oladi." title="Leveling" />
      <StatusBanner message={msg} status={status} />

      {!settings.enabled ? (
        <Notice tone="warn">
          Leveling o‘chirilgan — a‘zolar XP to‘plamaydi. Yoqish uchun pastdagi «Leveling yoqilgan» ni belgilab saqlang.
        </Notice>
      ) : null}

      <form action={saveLevelSettings.bind(null, guildId)}>
        <Card footer={<SaveButton />} icon="sliders" title="Sozlamalar">
          <div className="space-y-5">
            <Toggle defaultChecked={settings.enabled} label="Leveling yoqilgan" name="enabled" />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field defaultValue={settings.xp_min} hint="1–500" label="Minimal XP" max={500} min={1} name="xp_min" type="number" />
              <Field defaultValue={settings.xp_max} hint="Minimaldan kam bo‘lmaydi" label="Maksimal XP" max={500} min={1} name="xp_max" type="number" />
              <Field defaultValue={settings.cooldown_seconds} hint="Shu oraliqda faqat bir marta XP" label="Kutish (soniya)" max={3600} min={0} name="cooldown_seconds" type="number" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle defaultChecked={settings.announce_enabled} label="Yangi daraja haqida e‘lon qilish" name="announce_enabled" />
              <Toggle
                defaultChecked={settings.stack_rewards}
                hint="O‘chiq bo‘lsa faqat eng yuqori mukofot roli qoladi"
                label="Mukofot rollarini to‘plash"
                name="stack_rewards"
              />
            </div>

            <ChannelSelect
              channels={structure.channels}
              defaultValue={settings.announce_channel_id}
              emptyLabel="— xabar yozilgan kanal —"
              label="E‘lon kanali"
              name="announce_channel_id"
            />
            <TextArea
              defaultValue={settings.level_up_message}
              hint="O‘zgaruvchilar: {user}, {user.name}, {level}, {server}"
              label="E‘lon matni"
              name="level_up_message"
            />

            <div className="grid gap-5 lg:grid-cols-2">
              <MultiPicker
                hint="Bu kanallardagi xabarlar uchun XP berilmaydi (masalan, botlar kanali)."
                items={textChannels}
                kind="channel"
                label="XP berilmaydigan kanallar"
                name="ignored_channels"
                selected={asList(raw.ignored_channels)}
              />
              <MultiPicker
                items={structure.roles}
                kind="role"
                label="XP olmaydigan rollar"
                name="no_xp_roles"
                selected={asList(raw.no_xp_roles)}
              />
            </div>
          </div>
        </Card>
      </form>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card icon="trending" title="Reyting (top 25)">
            {members.length === 0 ? (
              <Empty icon="trending">Hali hech kim XP to‘plamagan.</Empty>
            ) : (
              <ol className="-my-2 divide-y divide-ink-600/70 text-sm">
                {members.map((member, index) => (
                  <li key={member.user_id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs ${
                        index === 0 ? 'bg-brand/20 text-brand-light' : index < 3 ? 'bg-ink-600 text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    {member.avatar ? (
                      <img alt="" className="h-7 w-7 rounded-full" src={member.avatar} />
                    ) : (
                      <span className="h-7 w-7 rounded-full bg-ink-600" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-slate-200">{member.user_tag ?? member.user_id}</span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-500">{Number(member.xp).toLocaleString('uz-UZ')} XP</span>
                    <span className="w-16 shrink-0 text-right font-medium text-brand-light">{member.level}-daraja</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card description="Darajaga yetgan a‘zoga avtomatik beriladi." icon="sparkles" title="Mukofot rollari">
            <form action={addLevelReward.bind(null, guildId)} className="space-y-3">
              <RoleSelect label="Rol" name="role_id" roles={structure.roles} />
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Field label="Daraja" max={500} min={1} name="level" placeholder="5" type="number" />
                </div>
                <button className="btn-primary h-[42px] shrink-0" type="submit">
                  <Icon className="h-4 w-4" name="plus" />
                  Qo‘shish
                </button>
              </div>
            </form>

            <div className="mt-5">
              {rewards.length === 0 ? (
                <Empty>Mukofotlar yo‘q.</Empty>
              ) : (
                <ul className="divide-y divide-ink-600/70 text-sm">
                  {rewards.map((reward) => {
                    const role = roleById.get(reward.role_id);
                    return (
                      <li key={reward.level} className="flex items-center gap-3 py-2">
                        <span className="w-20 shrink-0 font-medium text-slate-300">{reward.level}-daraja</span>
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: roleColor(role?.color ?? 0) }} />
                          {role ? (
                            <span className="truncate text-slate-200">@{role.name}</span>
                          ) : (
                            <span className="truncate text-amber-300/80" title={reward.role_id}>
                              ⚠ o‘chirilgan rol
                            </span>
                          )}
                        </span>
                        <form action={removeLevelReward.bind(null, guildId)}>
                          <input name="level" type="hidden" value={reward.level} />
                          <button
                            aria-label={`${reward.level}-daraja mukofotini o‘chirish`}
                            className="rounded p-1 text-slate-500 hover:bg-red-950/50 hover:text-red-300"
                            type="submit"
                          >
                            <Icon className="h-3.5 w-3.5" name="x" />
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
