'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export function FormField({
  label,
  error,
  children,
  className,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-[13px] font-medium text-slate-700">{label}</label>
      {children}
      {hint && !error ? <p className="text-xs leading-relaxed text-slate-400">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className, ...props }, ref) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full resize-y rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20',
        className,
      )}
      rows={3}
      {...props}
    />
  );
}

export function SelectInput({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20',
        className,
      )}
      {...props}>
      {children}
    </select>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.1)]">
      <div className="mb-6">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-end gap-3 border-t border-slate-100 pt-6', className)}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition duration-150 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-[0_14px_28px_-12px_rgba(37,99,235,0.7)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        className,
      )}
      disabled={loading || props.disabled}
      type={props.type ?? 'button'}
      {...props}>
      {loading ? 'Enregistrement…' : children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 active:translate-y-0',
        className,
      )}
      type={props.type ?? 'button'}
      {...props}>
      {children}
    </button>
  );
}
