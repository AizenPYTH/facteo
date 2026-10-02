'use client';

import { cn } from '@/lib/utils';

/**
 * Bandeau d'erreurs (validation échouée) : fond `dangerSoft`, titre avec le
 * nombre de points à corriger, puis la liste.
 */
export function ComposerErrorBanner({
  className,
  messages,
  title,
}: {
  className?: string;
  messages: string[];
  title: string;
}) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[14px] bg-iq-danger-soft px-4 py-3.5 text-iq-danger',
        className,
      )}
      role="alert">
      <svg aria-hidden className="mt-px shrink-0" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16.5v.01" />
      </svg>
      <div className="min-w-0">
        <p className="text-[14px] font-bold">{title}</p>
        {messages.length === 1 ? (
          <p className="mt-[3px] text-[13px] text-iq-ink2">{messages[0]}</p>
        ) : (
          <ul className="mt-[3px] list-disc space-y-0.5 pl-4 text-[13px] text-iq-ink2">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
