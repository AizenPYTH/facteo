'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { COMPOSER_TEMPLATES } from '@/lib/domain/pdf/composer-templates';
import { cn } from '@/lib/utils';

export function ComposerTemplateSidebar({
  value,
  onChange,
}: {
  value: string;
  onChange: (templateId: string) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Modèle
      </p>
      <div className="space-y-1">
        {COMPOSER_TEMPLATES.map((template) => {
          const active = value === template.id;
          return (
            <motion.button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition duration-150',
                active
                  ? 'bg-blue-50 text-primary ring-1 ring-primary/20'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
              key={template.id}
              onClick={() => onChange(template.id)}
              title={template.description}
              type="button"
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: template.primary }}
              />
              <span className="truncate">{template.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
