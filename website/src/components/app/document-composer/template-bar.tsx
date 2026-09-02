'use client';

import { COMPOSER_TEMPLATES } from '@/lib/domain/pdf/composer-templates';
import { cn } from '@/lib/utils';

export function ComposerTemplateBar({
  className,
  onChange,
  value,
}: {
  className?: string;
  onChange: (templateId: string) => void;
  value: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {COMPOSER_TEMPLATES.map((template) => {
        const active = value === template.id;

        return (
          <button
            aria-pressed={active}
            className={cn(
              'rounded-app-control border-2 p-1.5 transition-[background-color,border-color,color] duration-150',
              active
                ? 'border-app-accent bg-app-accent-soft'
                : 'border-app-border-soft hover:bg-app-hover',
            )}
            key={template.id}
            onClick={() => onChange(template.id)}
            title={template.description}
            type="button">
            <span className="block overflow-hidden rounded-md border border-app-border-soft bg-app-surface">
              <span className="block h-2 w-full" style={{ backgroundColor: template.primary }} />
              <span className="flex flex-col gap-[3px] px-2 py-2">
                <span className="h-[3px] w-8 rounded-full bg-app-border" />
                <span className="h-[3px] w-full rounded-full bg-app-border-soft" />
                <span className="h-[3px] w-full rounded-full bg-app-border-soft" />
                <span className="h-[3px] w-2/3 rounded-full bg-app-border-soft" />
              </span>
            </span>
            <span
              className={cn(
                'mt-1.5 block truncate text-center text-[11.5px] font-semibold',
                active ? 'text-app-accent-strong' : 'text-app-muted',
              )}>
              {template.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
