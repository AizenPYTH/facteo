'use client';

import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export function InlineFieldError({
  className,
  message,
}: {
  className?: string;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn(
        'mt-1.5 flex items-start gap-1.5 text-[12px] font-medium text-app-danger',
        className,
      )}
      role="alert">
      <AlertCircle className="mt-[1px] shrink-0" size={13} strokeWidth={1.75} />
      <span>{message}</span>
    </p>
  );
}

export function ComposerErrorBanner({
  className,
  messages,
}: {
  className?: string;
  messages: string[];
}) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-app-card border border-app-danger-border bg-app-danger-tint px-4 py-3',
        className,
      )}
      role="alert">
      <ul className="space-y-1.5">
        {messages.map((message) => (
          <li
            className="flex items-start gap-2 text-[13px] font-medium text-app-danger-text"
            key={message}>
            <AlertCircle className="mt-[1px] shrink-0" size={15} strokeWidth={1.75} />
            <span>{message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
