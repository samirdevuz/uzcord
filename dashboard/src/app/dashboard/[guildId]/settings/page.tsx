import { ChannelSelect, RoleSelect } from '@/components/pickers';
import { Card, PageHeader, Select, StatusBanner, StickySave, TextArea, Toggle } from '@/components/ui';
import { saveGeneralSettings } from '@/lib/actions';
import { requireGuildAccess } from '@/lib/guard';
import { getGuildStructure } from '@/lib/structure';
import { db } from '@/lib/supabase';

export const metadata = { title: 'Sozlamalar' };

const LOG_FIELDS = [
  { name: 'mod_log_channel_id', label: 'Moderatsiya logi', hint: 'Ban, kick, timeout, ogohlantirish va AutoMod' },
  { name: 'message_log_channel_id', label: 'Xabarlar logi', hint: "O'chirilgan va tahrirlangan xabarlar" },
  { name: 'member_log_channel_id', label: "A'zolar logi", hint: 'Kirish, chiqish, rol o‘zgarishlari, ban va unbanlar' },
  { name: 'server_log_channel_id', label: 'Server logi', hint: 'Kanal va rollar yaratilishi, o‘chirilishi' },
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

  const [{ data }, structure] = await Promise.all([
    db.from('guilds').select('*').eq('guild_id', guildId).maybeSingle(),
    getGuildStructure(guildId),
  ]);
  const settings = (data ?? {}) as Record<string, unknown>;
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

      <Card description="Tanlanmagan log yozilmaydi. Botda kanalga yozish va embed ruxsati bo‘lishi kerak." icon="list" title="Log kanallari">
        <div className="grid gap-4 sm:grid-cols-2">
          {LOG_FIELDS.map((field) => (
            <ChannelSelect
              key={field.name}
              channels={structure.channels}
              defaultValue={value(field.name)}
              emptyLabel="— o‘chiq —"
              hint={field.hint}
              label={field.label}
              name={field.name}
            />
          ))}
        </div>
      </Card>

      <Card description={TEMPLATE_HINT} icon="userPlus" title="Kutib olish">
        <div className="grid gap-4 sm:grid-cols-2">
          <ChannelSelect
            channels={structure.channels}
            defaultValue={value('welcome_channel_id')}
            emptyLabel="— o‘chiq —"
            label="Xush kelibsiz kanali"
            name="welcome_channel_id"
          />
          <ChannelSelect
            channels={structure.channels}
            defaultValue={value('goodbye_channel_id')}
            emptyLabel="— o‘chiq —"
            label="Xayrlashuv kanali"
            name="goodbye_channel_id"
          />
          <TextArea defaultValue={value('welcome_message')} label="Xush kelibsiz xabari" name="welcome_message" />
          <TextArea defaultValue={value('goodbye_message')} label="Xayrlashuv xabari" name="goodbye_message" />
          <div className="sm:col-span-2">
            <RoleSelect
              defaultValue={value('autorole_id')}
              hint="Yangi a'zolarga avtomatik beriladi. Botning roli bu roldan yuqorida turishi kerak."
              label="Avtomatik rol"
              name="autorole_id"
              roles={structure.roles}
            />
          </div>
        </div>
      </Card>

      <StickySave />
    </form>
  );
}
