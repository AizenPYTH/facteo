'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';

const iconButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-all duration-200 hover:border-primary/40 hover:text-primary';

export function BlogShare({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareTargets = [
    {
      label: 'Partager sur X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      icon: (
        <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'Partager sur LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: (
        <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {shareTargets.map((target) => (
        <a
          aria-label={target.label}
          className={iconButtonClass}
          href={target.href}
          key={target.label}
          rel="noopener noreferrer"
          target="_blank">
          {target.icon}
        </a>
      ))}
      <button aria-label="Copier le lien" className={iconButtonClass} onClick={handleCopy} type="button">
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
