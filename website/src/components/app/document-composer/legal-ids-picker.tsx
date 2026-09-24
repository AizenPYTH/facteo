'use client';

import { cn } from '@/lib/utils';
import {
  formatIssuerLegalIds,
  ISSUER_LEGAL_ID_LABELS,
  ISSUER_LEGAL_IDS,
  type IssuerLegalId,
} from '@/types/pdf-options';

/**
 * Choix des identifiants de l'entreprise affichés en tête de facture. Chaque
 * case montre la valeur réelle, ou signale qu'elle manque dans la page
 * Entreprise : une case cochée sans valeur n'apparaît pas sur la facture.
 */
export function LegalIdsPicker({
  company,
  onChange,
  value,
}: {
  company: { siret: string | null; vatNumber: string | null } | null;
  onChange: (value: IssuerLegalId[]) => void;
  value: IssuerLegalId[];
}) {
  const values = formatIssuerLegalIds(company?.siret, company?.vatNumber);

  function toggle(id: IssuerLegalId, checked: boolean) {
    onChange(ISSUER_LEGAL_IDS.filter((entry) => (entry === id ? checked : value.includes(entry))));
  }

  return (
    <div className="space-y-1.5">
      {ISSUER_LEGAL_IDS.map((id) => {
        const checked = value.includes(id);
        const shown = values[id];

        return (
          <label
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-app-field border px-2.5 py-[7px] transition-colors duration-150',
              checked ? 'border-app-accent-border bg-app-accent-tint' : 'border-app-border hover:border-app-accent',
            )}
            key={id}>
            <input
              checked={checked}
              className="h-[14px] w-[14px] shrink-0 [accent-color:var(--app-accent)]"
              onChange={(event) => toggle(id, event.target.checked)}
              type="checkbox"
            />
            <span className="w-14 shrink-0 text-[12.5px] font-semibold text-app-text">
              {ISSUER_LEGAL_ID_LABELS[id]}
            </span>
            <span
              className={cn(
                'app-num min-w-0 truncate text-[12px]',
                shown ? 'text-app-muted' : 'italic text-app-danger-text',
              )}>
              {shown ?? 'non renseigné (page Entreprise)'}
            </span>
          </label>
        );
      })}
    </div>
  );
}
