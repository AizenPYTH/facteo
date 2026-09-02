'use client';

import { AlertCircle } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const CONTROL_BASE =
  'w-full rounded-[9px] border border-app-border bg-app-surface px-[11px] py-[9px] text-[13px] text-app-text outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-app-faint hover:border-[#d7dbe8] focus:border-app-accent focus:shadow-[0_0_0_3px_rgba(79,70,229,0.14)] disabled:cursor-not-allowed disabled:bg-app-subtle disabled:text-app-muted aria-invalid:border-app-danger-field aria-invalid:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]';

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
      <label className="block text-xs font-medium text-app-text-3">{label}</label>
      {children}
      {hint && !error ? (
        <p className="text-[12px] leading-relaxed text-app-muted-2">{hint}</p>
      ) : null}
      {error ? (
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-app-danger">
          <AlertCircle className="shrink-0" size={14} strokeWidth={1.75} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input className={cn(CONTROL_BASE, className)} ref={ref} {...props} />;
  },
);

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL_BASE, 'resize-y', className)} rows={3} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL_BASE, className)} {...props}>
      {children}
    </select>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('rounded-[14px] border border-app-border bg-app-surface p-[18px]', className)}>
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-app-text">{title}</h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-app-muted">{description}</p>
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
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-app-border-soft pt-5',
        className,
      )}>
      {children}
    </div>
  );
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[10px] px-3.5 py-[9px] text-[13px] font-semibold transition-[background-color,border-color,color] duration-150 disabled:cursor-not-allowed disabled:opacity-60';

export function PrimaryButton({
  children,
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      className={cn(
        BUTTON_BASE,
        'bg-app-accent text-white shadow-app-primary hover:bg-app-accent-strong disabled:bg-app-accent-border disabled:shadow-none',
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
        BUTTON_BASE,
        'border border-app-border bg-app-surface text-app-text-2 hover:bg-app-hover',
        className,
      )}
      type={props.type ?? 'button'}
      {...props}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        BUTTON_BASE,
        'bg-transparent text-app-accent hover:bg-app-accent-tint',
        className,
      )}
      type={props.type ?? 'button'}
      {...props}>
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  variant = 'outline',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline' | 'solid' }) {
  return (
    <button
      className={cn(
        BUTTON_BASE,
        variant === 'solid'
          ? 'bg-app-danger text-white hover:bg-app-danger-text'
          : 'border border-app-danger-border bg-app-surface text-app-danger hover:bg-app-danger-tint',
        className,
      )}
      type={props.type ?? 'button'}
      {...props}>
      {children}
    </button>
  );
}
