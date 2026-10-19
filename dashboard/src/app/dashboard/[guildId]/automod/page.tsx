import { Icon } from '@/components/icons';
import { Card, Empty, Field, PageHeader, SaveButton, Select, StatusBanner, Toggle } from '@/components/ui';
import { addFilteredWord, removeFilteredWord, saveAutoModSettings } from '@/lib/actions';
import { AUTOMOD_DEFAULTS, type AutoModRow } from '@/lib/format';
import { requireGuildAccess } from '@/lib/guard';
import { asList, db } from '@/lib/supabase';

export const metadata = { title: 'AutoMod' };

const RULES: { name: keyof AutoModRow; label: string; hint: string }[] = [
  { name: 'anti_spam', label: 'Spam', hint: 'Qisqa vaqt ichida juda ko‘p xabar' },
  { name: 'anti_duplicate', label: 'Takroriy xabar', hint: 'Bir xil xabarni 30 soniyada 3 marta yuborish' },
  { name: 'anti_invite', label: 'Taklif havolalari', hint: 'discord.gg va boshqa server takliflari' },
  { name: 'anti_link', label: 'Tashqi havolalar', hint: 'Ruxsat etilgan domenlardan tashqari barcha havolalar' },
  { name: 'anti_mention', label: 'Mention toshqini', hint: 'Bitta xabarda juda ko‘p @eslatma' },
  { name: 'anti_caps', label: 'KATTA HARFLAR', hint: 'Kamida 10 harfli xabarlarda' },
  { name: 'anti_emoji', label: 'Emoji toshqini', hint: 'Bitta xabarda juda ko‘p emoji' },
  { name: 'word_filter', label: 'Taqiqlangan so‘zlar', hint: 'Pastdagi ro‘yxat; s0z, s-o-z, СЎЗ kabi variantlar ham ushlanadi' },
  { name: 'anti_raid', label: 'Reyd himoyasi', hint: 'Ko‘p a‘zo birdan kirsa mod-logga ogohlantirish' },
];

function IdList({ title, items, prefix }: { title: string; items: string[]; prefix?: string }) {
  return (
    <div>
      <p className="label">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <code key={item} className="rounded bg-ink-700 px-2 py-0.5 text-xs text-slate-300">
              {prefix}
              {item}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function AutoModPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  const { guildId } = await params;
  const { status, msg } = await searchParams;
  await requireGuildAccess(guildId);

  const [{ data: row }, { data: wordRows }] = await Promise.all([
    db.from('automod_settings').select('*').eq('guild_id', guildId).maybeSingle(),
    db
      .from('filtered_words')
      .select('word')
      .eq('guild_id', guildId)
      .order('word', { ascending: true }),
  ]);

  const automod: AutoModRow = { ...AUTOMOD_DEFAULTS, ...((row ?? {}) as Partial<AutoModRow>) };
  const words = (wordRows ?? []).map((item) => item.word as string);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Xabarlarni boshqarish yoki a‘zolarni cheklash ruxsati bor moderatorlar AutoMod’dan ozod."
        title="AutoMod"
      />
      <StatusBanner message={msg} status={status} />

      <form action={saveAutoModSettings.bind(null, guildId)} className="space-y-6">
        <Card icon="shieldCheck" title="Holat">
          <Toggle
            defaultChecked={automod.enabled}
            hint="O‘chiq bo‘lsa pastdagi qoidalarning hech biri ishlamaydi"
            label="AutoMod yoqilgan"
            name="enabled"
          />
        </Card>

        <Card icon="list" title="Qoidalar">
          <div className="grid gap-3 sm:grid-cols-2">
            {RULES.map((rule) => (
              <Toggle
                key={rule.name}
                defaultChecked={Boolean(automod[rule.name])}
                hint={rule.hint}
                label={rule.label}
                name={rule.name}
              />
            ))}
          </div>
        </Card>

        <Card icon="sliders" title="Chegaralar">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field defaultValue={automod.spam_limit} hint="2–50" label="Spam: xabarlar soni" max={50} min={2} name="spam_limit" type="number" />
            <Field defaultValue={Math.round(automod.spam_window_ms / 1000)} hint="1–120 soniya" label="Spam: vaqt oralig‘i" max={120} min={1} name="spam_window_seconds" type="number" />
            <Field defaultValue={automod.mention_limit} hint="1–50" label="Ko‘pi bilan mention" max={50} min={1} name="mention_limit" type="number" />
            <Field defaultValue={automod.caps_percent} hint="10–100 %" label="KATTA HARFLAR ulushi" max={100} min={10} name="caps_percent" type="number" />
            <Field defaultValue={automod.emoji_limit} hint="1–100" label="Ko‘pi bilan emoji" max={100} min={1} name="emoji_limit" type="number" />
            <Field defaultValue={automod.min_account_age_days} hint="Bundan yosh akkauntlar kick qilinadi. 0 = o‘chiq" label="Minimal akkaunt yoshi (kun)" max={365} min={0} name="min_account_age_days" type="number" />
            <Field defaultValue={automod.raid_join_limit} hint="2–100" label="Reyd: kirishlar soni" max={100} min={2} name="raid_join_limit" type="number" />
            <Field defaultValue={Math.round(automod.raid_window_ms / 1000)} hint="1–600 soniya" label="Reyd: vaqt oralig‘i" max={600} min={1} name="raid_window_seconds" type="number" />
          </div>
        </Card>

        <Card
          description="Qoida buzilganda xabar har doim o‘chiriladi. Bundan tashqari:"
          footer={<SaveButton />}
          icon="zap"
          title="Jazo"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              defaultValue={automod.punishment}
              hint="«Ogohlantirish» tanlansa, eskalatsiya qoidalari (/config escalation) ham ishlaydi"
              label="Jazo turi"
              name="punishment"
              options={[
                { value: 'delete', label: 'Faqat o‘chirish' },
                { value: 'warn', label: 'Ogohlantirish' },
                { value: 'timeout', label: 'Timeout' },
                { value: 'kick', label: 'Kick' },
                { value: 'ban', label: 'Ban' },
              ]}
            />
            <Field
              defaultValue={Math.round(automod.punishment_ms / 60_000)}
              hint="Timeout (ko‘pi bilan 28 kun) va ban uchun. Ban uchun 0 = doimiy ban"
              label="Muddat (daqiqa)"
              max={40320}
              min={0}
              name="punishment_minutes"
              type="number"
            />
          </div>
        </Card>
      </form>

      <Card
        description="Bot so‘zni xabar ichidan qidiradi — juda qisqa so‘zlar oddiy so‘zlar ichida ham topilishi mumkin."
        icon="type"
        title={`Taqiqlangan so‘zlar (${words.length})`}
      >
        <form action={addFilteredWord.bind(null, guildId)} className="flex gap-2">
          <input
            aria-label="Yangi so‘z"
            className="input"
            maxLength={60}
            name="word"
            placeholder="Yangi so‘z"
            required
          />
          <button className="btn-primary shrink-0" type="submit">
            <Icon className="h-4 w-4" name="plus" />
            Qo‘shish
          </button>
        </form>

        <div className="mt-4">
          {words.length === 0 ? (
            <Empty>Ro‘yxat bo‘sh.</Empty>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {words.map((word) => (
                <li key={word}>
                  <form
                    action={removeFilteredWord.bind(null, guildId)}
                    className="flex items-center gap-1 rounded-lg border border-ink-500 bg-ink-900/60 py-1 pl-3 pr-1 text-sm"
                  >
                    <span className="font-mono text-[13px] text-slate-200">{word}</span>
                    <input name="word" type="hidden" value={word} />
                    <button
                      aria-label={`${word} ni o‘chirish`}
                      className="rounded p-1 text-slate-500 transition-colors hover:bg-red-950/50 hover:text-red-300"
                      type="submit"
                    >
                      <Icon className="h-3.5 w-3.5" name="x" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card
        description="Bular hozircha faqat Discord’dan o‘zgartiriladi: /automod ignore va /automod domain"
        icon="lock"
        title="Istisnolar"
      >
        <div className="space-y-4">
          <IdList items={asList(automod.ignored_channels)} prefix="#" title="E‘tiborsiz kanallar" />
          <IdList items={asList(automod.ignored_roles)} prefix="@" title="E‘tiborsiz rollar" />
          <IdList items={asList(automod.allowed_domains)} title="Ruxsat etilgan domenlar" />
        </div>
      </Card>
    </div>
  );
}
