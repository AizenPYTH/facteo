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
    <div className="mb-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Modèle</p>
      <div className="space-y-1">
        {COMPOSER_TEMPLATES.map((template) => {
          const active = value === template.id;
          return (
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition',
                active
                  ? 'bg-blue-50 text-primary ring-1 ring-primary/20'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
              key={template.id}
              onClick={() => onChange(template.id)}
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
