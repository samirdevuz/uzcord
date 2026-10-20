import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

/**
 * Barcha komponentlar server tomonda render qilinadi — 'use client' yo'q.
 * Formalar oddiy HTML form sifatida yuboriladi, ya'ni dashboard
 * JavaScript o'chirilgan brauzerda ham to'liq ishlaydi.
 */

/** Dashboard sahifasining sarlavhasi. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}

export function Card({
  title,
  description,
  icon,
  children,
  footer,
  aside,
}: {
  title?: string;
  description?: string;
  icon?: IconName;
  children: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="card">
      {title ? (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div className={`flex gap-3 ${description ? 'items-start' : 'items-center'}`}>
            {icon ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-500 bg-ink-700 text-brand-light">
                <Icon className="h-4 w-4" name={icon} />
              </span>
            ) : null}
            <div>
              <h2 className="text-[15px] font-semibold text-white">{title}</h2>
              {description ? <p className="mt-1 text-sm leading-relaxed text-slate-400">{description}</p> : null}
            </div>
          </div>
          {aside}
        </header>
      ) : null}
      {children}
      {footer ? (
        <div className="-mx-5 -mb-5 mt-6 flex items-center justify-end gap-3 rounded-b-2xl border-t border-ink-600 bg-ink-900/40 px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  type = 'text',
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  hint?: string;
  type?: 'text' | 'number';
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        className={`input ${type === 'number' ? 'tabular-nums' : ''}`}
        defaultValue={defaultValue ?? ''}
        id={name}
        inputMode={type === 'number' ? 'numeric' : undefined}
        max={max}
        min={min}
        name={name}
        placeholder={placeholder}
        type={type}
      />
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  hint,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea
        className="input resize-y leading-relaxed"
        defaultValue={defaultValue ?? ''}
        id={name}
        name={name}
        rows={rows}
      />
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select className="input" defaultValue={defaultValue} id={name} name={name}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

/**
 * Switch ko'rinishidagi checkbox. Haqiqiy <input type="checkbox"> saqlanadi
 * (formalar `name=on` yuboradi), faqat ko'rinishi CSS `peer` orqali chiziladi.
 */
export function Toggle({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label
      className="group flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-ink-600
                 bg-ink-900/40 px-4 py-3.5 transition-colors hover:border-ink-500
                 has-[:checked]:border-leaf/30 has-[:checked]:bg-leaf/[0.04]"
      htmlFor={name}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-100">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{hint}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input className="peer sr-only" defaultChecked={defaultChecked} id={name} name={name} type="checkbox" />
        <span
          className="h-5 w-9 rounded-full bg-ink-500 transition-colors peer-checked:bg-leaf
                     peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50"
        />
        <span
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform
                     peer-checked:translate-x-4"
        />
      </span>
    </label>
  );
}

/** ?status=ok|err&msg=... dan kelgan natijani ko'rsatadi. */
export function StatusBanner({ status, message }: { status?: string; message?: string }) {
  if (!status || !message) return null;
  const ok = status === 'ok';
  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        ok ? 'border-leaf/30 bg-leaf/10 text-leaf-light' : 'border-red-900/60 bg-red-950/40 text-red-300'
      }`}
      role="status"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" name={ok ? 'check' : 'alert'} />
      <span>{message}</span>
    </div>
  );
}

/** Ma'lumot / ogohlantirish xabari. */
export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'error';
  children: ReactNode;
}) {
  const styles = {
    info: 'border-brand/30 bg-brand/[0.07] text-sky-200',
    warn: 'border-amber-800/50 bg-amber-950/30 text-amber-200',
    error: 'border-red-900/60 bg-red-950/40 text-red-300',
  }[tone];
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" name={tone === 'info' ? 'info' : 'alert'} />
      <div>{children}</div>
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: IconName;
}) {
  return (
    <div className="card relative overflow-hidden !p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        {icon ? <Icon className="h-4 w-4 text-slate-600" name={icon} /> : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export function Empty({ children, icon = 'sparkles' }: { children: ReactNode; icon?: IconName }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-500 px-4 py-10 text-center text-sm text-slate-500">
      <Icon className="h-5 w-5 text-slate-600" name={icon} />
      {children}
    </div>
  );
}

export function SaveButton({ children = 'Saqlash' }: { children?: ReactNode }) {
  return (
    <button className="btn-primary" type="submit">
      <Icon className="h-4 w-4" name="check" />
      {children}
    </button>
  );
}

/** Uzun formalar uchun ekran pastida doim ko'rinadigan saqlash paneli. */
export function StickySave({ note = 'O‘zgarishlar botga 1 daqiqa ichida yetadi.' }: { note?: string }) {
  return (
    <div className="sticky bottom-4 z-30">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink-500 bg-ink-800/90 px-5 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <p className="hidden text-xs text-slate-400 sm:block">{note}</p>
        <SaveButton />
      </div>
    </div>
  );
}

/** Rangli kichik yorliq (case turi va h.k.). */
export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
