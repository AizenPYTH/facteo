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
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && !error ? <p className="text-xs text-slate-400">{hint}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
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
        'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
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
        'w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
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
        'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20',
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
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
        'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60',
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
        'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50',
        className,
      )}
      type={props.type ?? 'button'}
      {...props}>
      {children}
    </button>
  );
}
