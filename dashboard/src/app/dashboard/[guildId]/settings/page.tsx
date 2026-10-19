import { Card, Field, PageHeader, SaveButton, Select, StatusBanner, TextArea, Toggle } from '@/components/ui';
import { saveGeneralSettings } from '@/lib/actions';
import { requireGuildAccess } from '@/lib/guard';
import { db } from '@/lib/supabase';

export const metadata = { title: 'Sozlamalar' };

const ID_HINT = "Discord'da Developer Mode ni yoqing, kanal ustida o'ng tugma → «Copy ID». Bo'sh = o'chiq.";

const LOG_FIELDS = [
  { name: 'mod_log_channel_id', label: 'Moderatsiya logi', hint: 'Ban, kick, timeout, ogohlantirish va AutoMod' },
  { name: 'message_log_channel_id', label: 'Xabarlar logi', hint: "O'chirilgan va tahrirlangan xabarlar" },
  { name: 'member_log_channel_id', label: "A'zolar logi", hint: 'Kirish, chiqish, rol o‘zgarishlari, ban va unbanlar' },
  { name: 'server_log_channel_id', label: 'Server logi', hint: 'Hozircha bot bu kanalga hech narsa yozmaydi' },
  { name: 'voice_log_channel_id', label: 'Ovozli kanallar logi', hint: 'Kirish, chiqish, kanal almashtirish' },
] as const;

const TEMPLATE_HINT =
  "O'zgaruvchilar: {user} — eslatma, {user.tag}, {user.name}, {user.id}, {server}, {memberCount}. Bo'sh = standart matn.";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ status?: string; msg?: string }>;
}) {
  const { guildId } = await params;
  const { status, msg } = await searchParams;
  await requireGuildAccess(guildId);

  const { data } = await db.from('guilds').select('*').eq('guild_id', guildId).maybeSingle();
  const settings = (data ?? {}) as Record<string, string | boolean | null | undefined>;
  const value = (key: string) => (settings[key] as string | null | undefined) ?? null;

  return (
    <form action={saveGeneralSettings.bind(null, guildId)} className="space-y-6">
      <PageHeader description="Til, log kanallari va yangi a‘zolarni kutib olish." title="Sozlamalar" />
      <StatusBanner message={msg} status={status} />

      <Card icon="globe" title="Umumiy">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            defaultValue={value('locale') ?? 'uz'}
            hint="Bot javoblari va loglar shu tilda yoziladi"
            label="Til"
            name="locale"
            options={[
              { value: 'uz', label: "O'zbekcha" },
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
            ]}
          />
          <div className="sm:pt-7">
            <Toggle
              defaultChecked={settings.dm_on_punish !== false}
              hint="Ban, kick, timeout yoki ogohlantirish olganda"
              label="Jazolanganlarga shaxsiy xabar yuborish"
              name="dm_on_punish"
            />
          </div>
        </div>
      </Card>

      <Card description={ID_HINT} icon="list" title="Log kanallari">
        <div className="grid gap-4 sm:grid-cols-2">
          {LOG_FIELDS.map((field) => (
            <Field
              key={field.name}
              defaultValue={value(field.name)}
              hint={field.hint}
              label={field.label}
              name={field.name}
              placeholder="Kanal IDsi"
            />
          ))}
        </div>
      </Card>

      <Card description={TEMPLATE_HINT} footer={<SaveButton />} icon="userPlus" title="Kutib olish">
        <div className="space-y-4">
          <Field
            defaultValue={value('welcome_channel_id')}
            label="Xush kelibsiz kanali"
            name="welcome_channel_id"
            placeholder="Kanal IDsi"
          />
          <TextArea
            defaultValue={value('welcome_message')}
            label="Xush kelibsiz xabari"
            name="welcome_message"
          />
          <Field
            defaultValue={value('goodbye_channel_id')}
            label="Xayrlashuv kanali"
            name="goodbye_channel_id"
            placeholder="Kanal IDsi"
          />
          <TextArea
            defaultValue={value('goodbye_message')}
            label="Xayrlashuv xabari"
            name="goodbye_message"
          />
          <Field
            defaultValue={value('autorole_id')}
            hint="Yangi a'zolarga avtomatik beriladi. Botning roli bu roldan yuqorida turishi kerak."
            label="Avtomatik rol"
            name="autorole_id"
            placeholder="Rol IDsi"
          />
        </div>
      </Card>
    </form>
  );
}
