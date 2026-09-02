'use client';

import { ComposerCard } from '@/components/app/document-composer/composer-card';
import { ComposerLivePreview } from '@/components/app/document-composer/live-preview';
import { ComposerTemplateBar } from '@/components/app/document-composer/template-bar';
import type { DraftDocumentInput } from '@/lib/domain/pdf/draft-pdf';
import type { DataScope } from '@/types/tenant';
import { cn } from '@/lib/utils';

export function ComposerPreviewColumn({
  className,
  draft,
  onTemplateChange,
  scope,
  templateId,
  userEmail,
}: {
  className?: string;
  draft: DraftDocumentInput;
  onTemplateChange: (templateId: string) => void;
  scope: DataScope | null;
  templateId: string;
  userEmail?: string | null;
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <ComposerCard title="Modèle PDF">
        <ComposerTemplateBar onChange={onTemplateChange} value={templateId} />
      </ComposerCard>

      <ComposerCard
        action={
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-app-faint">
            En direct
          </span>
        }
        title="Aperçu du document">
        <div className="aspect-[210/297] overflow-hidden rounded-app-control border border-app-border bg-app-subtle">
          <ComposerLivePreview
            className="bg-none bg-app-subtle"
            draft={draft}
            scope={scope}
            showToolbar={false}
            userEmail={userEmail}
          />
        </div>
      </ComposerCard>
    </div>
  );
}
