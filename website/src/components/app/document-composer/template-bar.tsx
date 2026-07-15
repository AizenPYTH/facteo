'use client';

import { COMPOSER_TEMPLATES } from '@/lib/domain/pdf/composer-templates';
import { cn } from '@/lib/utils';

export function ComposerTemplateBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (templateId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Modèle
      </span>
      <div className="flex gap-1.5">
        {COMPOSER_TEMPLATES.map((template) => {
          const active = value === template.id;
          return (
            <button
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                active
                  ? 'border-primary bg-primary text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary',
              )}
              key={template.id}
              onClick={() => onChange(template.id)}
              title={template.description}
              type="button">
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
                style={{ backgroundColor: template.primary }}
              />
              {template.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
