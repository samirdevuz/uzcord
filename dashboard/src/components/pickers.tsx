import { Field } from './ui';
import {
  CHANNEL_TYPE,
  TEXT_TYPES,
  groupChannels,
  roleColor,
  type GuildChannel,
  type GuildRole,
} from '@/lib/structure';

/**
 * Kanal/rol tanlagichlari — server komponentlar, JavaScript talab qilmaydi.
 * Bot hali ro'yxatni yubormagan bo'lsa (yangi o'rnatish), ID kiritish maydoniga qaytadi.
 */

const FALLBACK_HINT = 'Bot kanallar ro‘yxatini hali yubormagan — ID ni qo‘lda kiriting yoki botni qayta ishga tushiring.';

export function ChannelSelect({
  label,
  name,
  channels,
  defaultValue,
  hint,
  types = TEXT_TYPES,
  emptyLabel = '— tanlanmagan —',
}: {
  label: string;
  name: string;
  channels: GuildChannel[];
  defaultValue?: string | null;
  hint?: string;
  types?: readonly number[];
  emptyLabel?: string;
}) {
  if (channels.length === 0) {
    return <Field defaultValue={defaultValue} hint={hint ?? FALLBACK_HINT} label={label} name={name} placeholder="Kanal IDsi" />;
  }

  const groups = groupChannels(channels, types);
  const prefix = (channel: GuildChannel) =>
    channel.type === CHANNEL_TYPE.voice || channel.type === CHANNEL_TYPE.stage ? '🔊 ' : channel.type === CHANNEL_TYPE.category ? '📁 ' : '# ';
  // Saqlangan kanal o'chirilgan bo'lsa ham qiymat yo'qolmasin.
  const missing = defaultValue && !channels.some((channel) => channel.id === defaultValue);

  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select className="input" defaultValue={defaultValue ?? ''} id={name} name={name}>
        <option value="">{emptyLabel}</option>
        {missing ? <option value={defaultValue!}>⚠ O‘chirilgan kanal ({defaultValue})</option> : null}
        {groups.map((group) =>
          group.label ? (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {prefix(channel)}
                  {channel.name}
                </option>
              ))}
            </optgroup>
          ) : (
            group.items.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {prefix(channel)}
                {channel.name}
              </option>
            ))
          )
        )}
      </select>
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function RoleSelect({
  label,
  name,
  roles,
  defaultValue,
  hint,
  assignableOnly = true,
}: {
  label: string;
  name: string;
  roles: GuildRole[];
  defaultValue?: string | null;
  hint?: string;
  /** Bot yoki integratsiya rollari (managed) hech kimga berilmaydi. */
  assignableOnly?: boolean;
}) {
  if (roles.length === 0) {
    return <Field defaultValue={defaultValue} hint={hint ?? FALLBACK_HINT} label={label} name={name} placeholder="Rol IDsi" />;
  }
  const list = assignableOnly ? roles.filter((role) => !role.managed) : roles;
  const missing = defaultValue && !roles.some((role) => role.id === defaultValue);

  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select className="input" defaultValue={defaultValue ?? ''} id={name} name={name}>
        <option value="">— tanlanmagan —</option>
        {missing ? <option value={defaultValue!}>⚠ O‘chirilgan rol ({defaultValue})</option> : null}
        {list.map((role) => (
          <option key={role.id} value={role.id}>
            @{role.name}
          </option>
        ))}
      </select>
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

/** Bir nechta kanal yoki rolni belgilash — har biri `name` bo'yicha alohida qiymat yuboradi. */
export function MultiPicker({
  label,
  name,
  items,
  selected,
  hint,
  kind,
}: {
  label: string;
  name: string;
  items: { id: string; name: string; color?: number }[];
  selected: string[];
  hint?: string;
  kind: 'channel' | 'role';
}) {
  const known = new Set(items.map((item) => item.id));
  const stale = selected.filter((id) => !known.has(id));

  return (
    <fieldset>
      <legend className="label">{label}</legend>
      {items.length === 0 && stale.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ink-500 px-3 py-4 text-center text-xs text-slate-500">
          {FALLBACK_HINT}
        </p>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-ink-500 bg-ink-950/60 p-1.5">
          <div className="grid gap-0.5 sm:grid-cols-2">
            {items.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-slate-300 hover:bg-ink-700/60 has-[:checked]:bg-brand/10 has-[:checked]:text-white"
              >
                <input className="h-3.5 w-3.5 shrink-0 accent-brand" defaultChecked={selected.includes(item.id)} name={name} type="checkbox" value={item.id} />
                {kind === 'role' ? (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: roleColor(item.color ?? 0) }} />
                ) : (
                  <span className="text-slate-500">#</span>
                )}
                <span className="truncate">{item.name}</span>
              </label>
            ))}
            {stale.map((id) => (
              <label key={id} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-amber-300/80">
                <input className="h-3.5 w-3.5 accent-brand" defaultChecked name={name} type="checkbox" value={id} />
                <span className="truncate">⚠ o‘chirilgan ({id})</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {hint ? <p className="hint">{hint}</p> : null}
    </fieldset>
  );
}
