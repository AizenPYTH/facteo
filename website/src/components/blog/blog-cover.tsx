import { FileText, ShieldCheck, Users, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { BlogCategory } from '@/types/blog';

const CATEGORY_ICON: Record<BlogCategory, LucideIcon> = {
  Facturation: FileText,
  'Gestion client': Users,
  'Bonnes pratiques': ShieldCheck,
};

const CATEGORY_GRADIENT: Record<BlogCategory, [string, string, string]> = {
  Facturation: ['#6366f1', '#4f46e5', '#312e81'],
  'Gestion client': ['#a855f7', '#7c3aed', '#4c1d95'],
  'Bonnes pratiques': ['#2563eb', '#4f46e5', '#1e3a8a'],
};

function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value << 5) - value + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value);
}

export function BlogCover({
  slug,
  category,
  className,
}: {
  slug: string;
  category: BlogCategory;
  className?: string;
}) {
  const seed = hash(slug);
  const [from, mid, to] = CATEGORY_GRADIENT[category];
  const Icon = CATEGORY_ICON[category];

  const blob1X = 15 + (seed % 30);
  const blob1Y = 10 + ((seed >> 3) % 25);
  const blob2X = 55 + ((seed >> 5) % 35);
  const blob2Y = 45 + ((seed >> 7) % 40);
  const iconRotate = -18 + (seed % 36);

  const gradientId = `blog-cover-${slug}`;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: `linear-gradient(155deg, ${from} 0%, ${mid} 55%, ${to} 100%)` }}>
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full mix-blend-overlay"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 100 100">
        <defs>
          <radialGradient id={`${gradientId}-a`}>
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${gradientId}-b`}>
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={blob1X} cy={blob1Y} fill={`url(#${gradientId}-a)`} r="38" />
        <circle cx={blob2X} cy={blob2Y} fill={`url(#${gradientId}-b)`} r="30" />
      </svg>
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <Icon
        aria-hidden
        className="absolute -bottom-6 -right-6 h-32 w-32 text-white/15"
        strokeWidth={1.25}
        style={{ transform: `rotate(${iconRotate}deg)` }}
      />
    </div>
  );
}
