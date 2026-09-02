'use client';

import { COMPOSER_TEMPLATES } from '@/lib/domain/pdf/composer-templates';
import { cn } from '@/lib/utils';

export function ComposerTemplateSidebar({
  value,
  onChange,
}: {
  value: string;
  onChange: (templateId: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">
        Modèle
      </p>
      <div className="space-y-1">
        {COMPOSER_TEMPLATES.map((template) => {
          const active = value === template.id;

          return (
            <button
              aria-pressed={active}
              className={cn(
                'flex w-full items-center gap-2 rounded-app-field px-2.5 py-2 text-left text-[12.5px] transition-[background-color,border-color,color] duration-150',
                active
                  ? 'bg-app-accent-tint font-semibold text-app-accent'
                  : 'font-medium text-app-text-3 hover:bg-app-hover',
              )}
              key={template.id}
              onClick={() => onChange(template.id)}
              title={template.description}
              type="button">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: template.primary }}
              />
              <span className="truncate">{template.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
