import type { ReactNode } from 'react';

/**
 * Barcha komponentlar server tomonda render qilinadi — 'use client' yo'q.
 * Formalar oddiy HTML form sifatida yuboriladi, ya'ni dashboard
 * JavaScript o'chirilgan brauzerda ham to'liq ishlaydi.
 */

export function Card({
  title,
  description,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="card">
      {title ? (
        <header className="mb-4">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </header>
      ) : null}
      {children}
      {footer ? <div className="mt-5 border-t border-ink-600 pt-4">{footer}</div> : null}
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
        className="input"
        id={name}
        name={name}
        type={type}
        min={min}
        max={max}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
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
        className="input resize-y"
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
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
      <select className="input" id={name} name={name} defaultValue={defaultValue}>
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
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-600
                 bg-ink-800/40 px-4 py-3 hover:border-ink-500"
      htmlFor={name}
    >
      <input
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
      />
      <span>
        <span className="block text-sm font-medium text-slate-200">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-slate-500">{hint}</span> : null}
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
      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
        ok
          ? 'border-brand/40 bg-brand/10 text-brand-light'
          : 'border-red-900/60 bg-red-950/30 text-red-300'
      }`}
      role="status"
    >
      {ok ? '✅ ' : '⚠️ '}
      {message}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-ink-600 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}

export function SaveButton({ children = 'Saqlash' }: { children?: ReactNode }) {
  return (
    <button className="btn-primary" type="submit">
      {children}
    </button>
  );
}
