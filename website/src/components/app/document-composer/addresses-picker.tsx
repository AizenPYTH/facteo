'use client';

import { TextArea } from '@/components/app/form-fields';
import type { Client } from '@/types/client';
import {
  clientAddresses,
  INVOICE_ADDRESS_KEYS,
  INVOICE_ADDRESS_LABELS,
  MARKETPLACE_PRESETS,
  type InvoiceAddresses,
} from '@/types/pdf-options';

const PLACEHOLDERS: Record<keyof InvoiceAddresses, string> = {
  soldBy: 'Votre entreprise\nAdresse\nCode postal Ville',
  marketplace: 'Amazon.fr\nAmazon EU S.à r.l.\n…',
  billing: 'Société ou nom de l’acheteur\nAdresse de facturation',
  shipping: 'Prénom Nom\nTéléphone\nAdresse de livraison',
};

const CHIP =
  'rounded-app-field border border-app-border px-2.5 py-[5px] text-[12px] font-semibold text-app-muted transition-colors hover:border-app-accent hover:text-app-text';

/**
 * Adresses imprimées au-dessus des lignes : vendu par, place de marché,
 * facturation, livraison. Un bloc vide n'apparaît pas sur la facture.
 * `onCommit` (facture existante) enregistre à la sortie d'un champ, pas à
 * chaque frappe.
 */
export function AddressesPicker({
  client,
  company,
  onChange,
  onCommit,
  value,
}: {
  /** Client de la facture : sa fiche remplit facturation et livraison. */
  client?: Client | null;
  company: {
    name: string;
    vatNumber?: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
  } | null;
  onChange: (value: InvoiceAddresses) => void;
  onCommit?: (value: InvoiceAddresses) => void;
  value: InvoiceAddresses;
}) {
  function set(patch: Partial<InvoiceAddresses>, commit = false) {
    const next = { ...value, ...patch };
    onChange(next);
    if (commit) onCommit?.(next);
  }

  function companySoldBy(): string {
    if (!company) return '';
    return [
      company.name,
      company.address,
      [company.postalCode, company.city].filter(Boolean).join(' '),
      company.country,
      company.vatNumber ? `TVA ${company.vatNumber}` : null,
    ]
      .filter((line): line is string => Boolean(line?.trim()))
      .join('\n');
  }

  function fillSoldByFromCompany() {
    if (!company) return;
    set({ soldBy: companySoldBy() }, true);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12px] font-medium text-app-text-3">Place de marché :</span>
        {MARKETPLACE_PRESETS.map((preset) => (
          <button
            className={CHIP}
            key={preset.label}
            onClick={() =>
              // Vendu sur une place de marché : le vendeur, c'est votre entreprise.
              set({ marketplace: preset.value, soldBy: value.soldBy.trim() || companySoldBy() }, true)
            }
            type="button">
            {preset.label}
          </button>
        ))}
        {company ? (
          <button className={CHIP} onClick={fillSoldByFromCompany} type="button">
            Vendu par : mon entreprise
          </button>
        ) : null}
        {client ? (
          <button className={CHIP} onClick={() => set(clientAddresses(client), true)} type="button">
            Facturation et livraison : depuis le client
          </button>
        ) : null}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {INVOICE_ADDRESS_KEYS.map((key) => (
          <label className="block" key={key}>
            <span className="mb-1 block text-[12px] font-medium text-app-text-3">
              {INVOICE_ADDRESS_LABELS[key]}
            </span>
            <TextArea
              className="min-h-[76px] text-[12.5px]"
              maxLength={600}
              onBlur={() => onCommit?.(value)}
              onChange={(event) => set({ [key]: event.target.value })}
              placeholder={PLACEHOLDERS[key]}
              rows={3}
              value={value[key]}
            />
          </label>
        ))}
      </div>
      <p className="text-[11.5px] leading-relaxed text-app-muted-2">
        Un bloc laissé vide n’apparaît pas. Les adresses s’impriment au-dessus des lignes, sur tous les modèles.
      </p>
    </div>
  );
}
