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
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientVatNumber?: string | null;
  clientSiren?: string | null;
  clientSiret?: string | null;
  clientCountry?: string | null;
  clientPostalCode?: string | null;
  companyIban?: string | null;
  companyVatNumber?: string | null;
  currency?: string | null;
  invoiceNumber?: string | null;
  vatRegime?: VatRegime | string | null;
  linesCount: number;
  hasPositiveTotals: boolean;
};

export function validateInvoicePreflight(input: InvoicePreflightInput): PreflightIssue[] {
  const issues: PreflightIssue[] = [];

  if (!input.clientId) {
    issues.push({
      code: 'client_required',
      level: 'error',
      message: 'Sélectionnez un client avant de créer la facture.',
    });
  }

  if (input.linesCount < 1) {
    issues.push({
      code: 'lines_required',
      level: 'error',
      message: 'Ajoutez au moins une ligne de prestation.',
    });
  }

  if (!input.hasPositiveTotals) {
    issues.push({
      code: 'totals',
      level: 'warning',
      message: 'Le total de la facture semble nul. Vérifiez les montants.',
    });
  }

  if (input.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.clientEmail)) {
    issues.push({
      code: 'email',
      level: 'error',
      message: 'L’email du client est invalide.',
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
      message: 'La devise est invalide.',
    });
  }

  if (
    input.vatRegime === 'eu_reverse_charge' &&
    !input.clientVatNumber?.trim()
  ) {
    issues.push({
      code: 'reverse_charge_vat',
      level: 'error',
      message: 'L’autoliquidation UE nécessite le N° TVA du client.',
    });
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
