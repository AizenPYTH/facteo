import { hasValidClientIdentity, CLIENT_IDENTITY_ERROR } from '@/lib/clients/identity';
import { isValidPhone, isValidPostalCode } from '@/lib/format/phone';
import { isValidSiren, isValidSiret, normalizeRegistrationDigits } from '@/lib/company-search';
import type { VatRegime } from '@/types/invoice';

export type PreflightIssue = {
  code: string;
  level: 'error' | 'warning';
  message: string;
};

export type InvoicePreflightInput = {
  clientId?: string | null;
  clientCompany?: string | null;
  clientLastName?: string | null;
  clientFirstName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientVatNumber?: string | null;
  clientSiren?: string | null;
  clientSiret?: string | null;
  clientCountry?: string | null;
  clientPostalCode?: string | null;
  clientAddress?: string | null;
  clientCity?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  companyPostalCode?: string | null;
  companyCity?: string | null;
  companySiret?: string | null;
  companyIban?: string | null;
  companyVatNumber?: string | null;
  companyLegalForm?: string | null;
  currency?: string | null;
  invoiceNumber?: string | null;
  vatRegime?: VatRegime | string | null;
  documentKind?: 'invoice' | 'credit_note' | null;
  linesCount: number;
  hasPositiveTotals: boolean;
  totalsMatch?: boolean;
};

export function validateInvoicePreflight(input: InvoicePreflightInput): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const isCreditNote = input.documentKind === 'credit_note';

  if (!input.clientId) {
    issues.push({
      code: 'client_required',
      level: 'error',
      message: 'Sélectionnez un client avant d’émettre la facture.',
    });
  } else if (
    !hasValidClientIdentity({
      company: input.clientCompany,
      lastName: input.clientLastName,
      firstName: input.clientFirstName,
    })
  ) {
    issues.push({
      code: 'client_identity',
      level: 'error',
      message: `Client incomplet : ${CLIENT_IDENTITY_ERROR}`,
    });
  }

  if (input.linesCount < 1) {
    issues.push({
      code: 'lines_required',
      level: 'error',
      message: 'Ajoutez au moins une ligne de prestation ou de produit.',
    });
  }

  if (!input.hasPositiveTotals) {
    issues.push({
      code: 'totals',
      level: isCreditNote ? 'warning' : 'error',
      message: isCreditNote
        ? 'Le total de l’avoir semble nul. Vérifiez les montants.'
        : 'Le total TTC doit être supérieur à 0 pour émettre la facture.',
    });
  }

  if (input.totalsMatch === false) {
    issues.push({
      code: 'totals_mismatch',
      level: 'error',
      message: 'Les montants HT / TVA / TTC sont incohérents. Vérifiez les lignes.',
    });
  }

  if (!input.companyName?.trim()) {
    issues.push({
      code: 'seller_name',
      level: 'error',
      message: 'Le nom de votre entreprise est manquant (Paramètres → Entreprise).',
    });
  }

  if (!input.companyAddress?.trim() || !input.companyCity?.trim()) {
    issues.push({
      code: 'seller_address',
      level: 'error',
      message: 'L’adresse de votre entreprise est incomplète (rue et ville requises).',
    });
  }

  if (!input.companySiret?.trim()) {
    issues.push({
      code: 'seller_siret',
      level: 'error',
      message: 'Le SIRET de votre entreprise est obligatoire pour émettre une facture.',
    });
  } else {
    const siret = normalizeRegistrationDigits(input.companySiret);
    if (!isValidSiret(siret)) {
      issues.push({
        code: 'seller_siret_invalid',
        level: 'error',
        message: 'Le SIRET de votre entreprise est invalide.',
      });
    }
  }

  if (input.vatRegime !== 'exempt' && !input.companyVatNumber?.trim()) {
    issues.push({
      code: 'seller_vat',
      level: 'warning',
      message:
        'N° TVA de votre entreprise manquant. Requis sauf franchise en base (régime exonéré).',
    });
  }

  if (!input.companyLegalForm?.trim()) {
    issues.push({
      code: 'seller_legal_form',
      level: 'warning',
      message: 'Forme juridique manquante (SAS, SARL, EI…). Recommandée sur la facture.',
    });
  }

  if (input.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.clientEmail)) {
    issues.push({
      code: 'email',
      level: 'error',
      message: 'L’e-mail du client est invalide.',
    });
  }

  if (input.clientPhone && !isValidPhone(input.clientPhone)) {
    issues.push({
      code: 'phone',
      level: 'error',
      message: 'Le téléphone du client est invalide.',
    });
  }

  if (input.clientPostalCode && !isValidPostalCode(input.clientPostalCode)) {
    issues.push({
      code: 'postal',
      level: 'warning',
      message: 'Le code postal du client semble invalide.',
    });
  }

  if (!input.clientAddress?.trim() || !input.clientCity?.trim()) {
    issues.push({
      code: 'client_address',
      level: 'warning',
      message: 'L’adresse du client est incomplète — recommandée sur une facture.',
    });
  }

  if (input.clientVatNumber) {
    const vat = input.clientVatNumber.replace(/\s/g, '');
    if (!/^[A-Z]{2}[A-Z0-9]{2,13}$/i.test(vat)) {
      issues.push({
        code: 'vat',
        level: 'error',
        message: 'Le numéro de TVA du client est invalide.',
      });
    }
  }

  if (input.clientSiren) {
    const siren = normalizeRegistrationDigits(input.clientSiren);
    if (!isValidSiren(siren)) {
      issues.push({
        code: 'siren',
        level: 'error',
        message: 'Le SIREN du client est invalide.',
      });
    }
  }

  if (input.clientSiret) {
    const siret = normalizeRegistrationDigits(input.clientSiret);
    if (!isValidSiret(siret)) {
      issues.push({
        code: 'siret',
        level: 'error',
        message: 'Le SIRET du client est invalide.',
      });
    }
  }

  if (input.companyIban) {
    const iban = input.companyIban.replace(/\s/g, '');
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i.test(iban)) {
      issues.push({
        code: 'iban',
        level: 'warning',
        message: 'L’IBAN de votre entreprise semble invalide.',
      });
    }
  }

  if (input.currency && !/^[A-Z]{3}$/.test(input.currency)) {
    issues.push({
      code: 'currency',
      level: 'error',
      message: 'La devise est invalide (ex. EUR).',
    });
  }

  if (!input.currency?.trim()) {
    issues.push({
      code: 'currency_missing',
      level: 'warning',
      message: 'Aucune devise configurée — EUR sera utilisé par défaut.',
    });
  }

  if (input.invoiceNumber != null && !input.invoiceNumber.trim()) {
    issues.push({
      code: 'invoice_number',
      level: 'error',
      message: 'Le numéro de facture est manquant.',
    });
  }

  if (input.vatRegime === 'eu_reverse_charge' && !input.clientVatNumber?.trim()) {
    issues.push({
      code: 'reverse_charge_vat',
      level: 'error',
      message: 'L’autoliquidation UE nécessite le N° TVA intracommunautaire du client.',
    });
  }

  if (input.vatRegime === 'export_outside_eu') {
    const country = (input.clientCountry ?? '').trim().toLowerCase();
    if (!country || country === 'france' || country === 'fr') {
      issues.push({
        code: 'export_country',
        level: 'error',
        message: 'Export hors UE : le pays du client doit être hors Union européenne.',
      });
    }
  }

  if (!input.clientCountry?.trim()) {
    issues.push({
      code: 'country',
      level: 'warning',
      message: 'Le pays du client est manquant — les mentions TVA peuvent être inexactes.',
    });
  }

  return issues;
}

export function hasBlockingPreflightIssues(issues: PreflightIssue[]): boolean {
  return issues.some((issue) => issue.level === 'error');
}

export function formatPreflightErrors(issues: PreflightIssue[]): string {
  return issues
    .filter((issue) => issue.level === 'error')
    .map((issue) => issue.message)
    .join('\n');
}

export function formatPreflightWarnings(issues: PreflightIssue[]): string {
  return issues
    .filter((issue) => issue.level === 'warning')
    .map((issue) => issue.message)
    .join('\n');
}
