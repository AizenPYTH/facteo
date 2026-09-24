import { PAYMENT_METHOD_LABELS, type PaymentMethodId } from '@/types/payment-methods';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { formatDateTimeForPdf } from '@/lib/format/datetime';
import { parseAmountInput, parseVatRateForTotals } from '@/lib/format/decimal';
import { buildSepaCreditTransferPayload } from '@/lib/payments/sepa-qr';
import { renderQrCodeSvg } from '@/lib/pdf/qr-svg';
import { mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { PdfClientInfo, PdfCompanyInfo, PdfDocumentInput } from '@/lib/pdf/engine/types';
import { DEFAULT_ISSUER_LEGAL_IDS, ISSUER_LEGAL_ID_LABELS } from '@/types/pdf-options';

/**
 * Vue de rendu partagée par les 20 modèles.
 *
 * Tout y est **déjà formaté** : montants en euros, dates en français, TVA par
 * taux, QR encodé. Un modèle ne fait que disposer ces chaînes — il ne calcule
 * rien et n'accède jamais aux données brutes.
 *
 * Règle d'or du handoff, appliquée ici plutôt que dans chaque modèle : toute
 * donnée absente vaut `null` ou tableau vide, et le bloc correspondant
 * disparaît. Jamais de libellé orphelin, jamais de « — » technique.
 */

export type TemplateParty = {
  name: string;
  initials: string;
  contactName: string | null;
  addressLines: string[];
  siret: string | null;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
};

export type TemplateLine = {
  index: number;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  totalHt: string;
};

export type TemplateVatRow = { rate: string; base: string; amount: string };

export type TemplateMetaEntry = { label: string; value: string; strong?: boolean };

export type TemplateTotalsRow = { label: string; value: string };

export type TemplateContext = {
  kind: 'invoice' | 'quote';
  /** Libellés qui changent entre facture et devis. */
  labels: {
    document: string;
    documentUpper: string;
    number: string;
    issuedAt: string;
    secondaryDate: string;
    amountDue: string;
    designation: string;
    quantity: string;
    unitPrice: string;
    vat: string;
    totalHt: string;
    billedTo: string;
    issuer: string;
    payment: string;
    signature: string;
  };
  number: string;
  issuedAt: string | null;
  secondaryDate: string | null;
  issuer: TemplateParty;
  client: TemplateParty;
  logoUrl: string | null;
  lines: TemplateLine[];
  /** Dates / conditions, déjà filtrées : n'y figure que ce qui existe. */
  meta: TemplateMetaEntry[];
  totals: {
    rows: TemplateTotalsRow[];
    vat: TemplateVatRow[];
    subtotalHt: string;
    totalHt: string;
    totalVat: string;
    totalTtc: string;
    amountDue: string;
    /** Chaîne vide si aucune remise. */
    discount: string | null;
    deposit: string | null;
  };
  payment: {
    terms: string | null;
    iban: string | null;
    bic: string | null;
    methods: string[];
    /** Une seule ligne condensée, pour les modèles compacts. */
    summary: string | null;
  };
  qrSvg: string | null;
  legalMentions: string[];
  notes: string | null;
  signature: { url: string; caption: string } | null;
  clientSignature: { url: string; caption: string } | null;
  /** Devis uniquement : bloc « Bon pour accord ». */
  showApprovalBlock: boolean;
  /** Pastille de statut. Affichée par le modèle 04 uniquement. */
  status: { label: string; background: string; color: string } | null;
  /**
   * Identifiants de l'émetteur choisis pour le document (SIREN, SIRET, TVA),
   * rendus en tête de page par l'enveloppe commune. Les modèles ne les
   * affichent plus eux-mêmes : `issuer.siret` et `issuer.vatNumber` valent `null`.
   */
  issuerLegalIds: TemplateMetaEntry[];
  /** Facture payée : cachet au nom de l'entreprise émettrice. */
  paidStamp: { companyName: string; date: string | null } | null;
};

/**
 * Pastille de statut — uniquement des statuts réellement portés par la base
 * (`invoices.status`, `quotes.status`). Aucun statut n'est inventé.
 */
const STATUS_PILLS: Record<string, { label: string; background: string; color: string }> = {
  draft: { label: 'Brouillon', background: '#EEF0F4', color: '#5B5B72' },
  sent: { label: 'En attente', background: '#FFF3E0', color: '#A85B00' },
  partially_paid: { label: 'Partiellement payée', background: '#FFF3E0', color: '#A85B00' },
  paid: { label: 'Payée', background: '#E6F6EC', color: '#0B7A4B' },
  overdue: { label: 'En retard', background: '#FDECEC', color: '#C0392B' },
  canceled: { label: 'Annulée', background: '#EEF0F4', color: '#7A7A8C' },
  accepted: { label: 'Accepté', background: '#E6F6EC', color: '#0B7A4B' },
  rejected: { label: 'Refusé', background: '#FDECEC', color: '#C0392B' },
  expired: { label: 'Expiré', background: '#EEF0F4', color: '#7A7A8C' },
  converted: { label: 'Converti', background: '#EEF0F4', color: '#5B5B72' },
};

function formatIban(value: string): string {
  return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
}

function initialsOf(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function digitsOf(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function groupDigits(digits: string, sizes: number[]): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const size of sizes) {
    if (cursor >= digits.length) break;
    parts.push(digits.slice(cursor, cursor + size));
    cursor += size;
  }
  return parts.join(' ');
}

/** Le SIREN n'est pas saisi à part : ce sont les 9 premiers chiffres du SIRET. */
function buildIssuerLegalIds(input: PdfDocumentInput): TemplateMetaEntry[] {
  const selected = input.issuerLegalIds ?? DEFAULT_ISSUER_LEGAL_IDS;
  const siret = digitsOf(input.company.siret);
  const values = {
    siren: siret.length >= 9 ? groupDigits(siret.slice(0, 9), [3, 3, 3]) : null,
    siret: siret.length === 14 ? groupDigits(siret, [3, 3, 3, 5]) : clean(input.company.siret),
    vat: clean(input.company.vatNumber)?.replace(/\s/g, '').toUpperCase() ?? null,
  };

  return selected
    .map((id) => (values[id] ? { label: ISSUER_LEGAL_ID_LABELS[id], value: values[id] } : null))
    .filter((entry): entry is TemplateMetaEntry => entry !== null);
}

function buildIssuer(company: PdfCompanyInfo): TemplateParty {
  const name =
    clean(company.companyName) ??
    clean([company.firstName, company.lastName].filter(Boolean).join(' ')) ??
    '';

  return {
    name,
    initials: initialsOf(name),
    contactName: null,
    addressLines: [
      clean(company.address),
      clean([company.postalCode, company.city].filter(Boolean).join(' ')),
      clean(company.country),
    ].filter((line): line is string => Boolean(line)),
    // Rendus en tête de page selon le choix de l'utilisateur (`issuerLegalIds`).
    siret: null,
    vatNumber: null,
    email: clean(company.email),
    phone: clean(company.phone),
  };
}

function buildClient(client: PdfClientInfo): TemplateParty {
  const person = clean([client.firstName, client.lastName].filter(Boolean).join(' '));
  const company = clean(client.company);
  const name = company ?? person ?? 'Client';

  return {
    name,
    initials: initialsOf(name),
    // Le contact n'apparaît que s'il ajoute une information au nom affiché.
    contactName: company && person ? person : null,
    addressLines: [
      clean(client.address),
      clean([client.postalCode, client.city].filter(Boolean).join(' ')),
      clean(client.country),
    ].filter((line): line is string => Boolean(line)),
    siret: null,
    vatNumber: clean(client.vatNumber),
    email: clean(client.email),
    phone: clean(client.phone),
  };
}

function buildLines(input: PdfDocumentInput): TemplateLine[] {
  return input.lines.map((line, index) => {
    const totals = mapLineValueToTotals(line);
    const title = clean(line.title) ?? clean(line.description) ?? 'Prestation';
    const description = clean(line.title) ? (clean(line.description) ?? '') : '';

    return {
      index: index + 1,
      title,
      description,
      quantity: clean(line.quantity) ?? '0',
      unit: clean(line.unit) ?? '',
      unitPrice: formatPriceHT(parseAmountInput(line.unitPrice)),
      vatRate: formatVatRate(parseVatRateForTotals(line.vatRate)),
      totalHt: formatPriceHT(totals.lineTotalHt),
    };
  });
}

function buildVatRows(input: PdfDocumentInput): TemplateVatRow[] {
  const buckets = new Map<number, { base: number; amount: number }>();

  input.lines.forEach((line) => {
    const totals = mapLineValueToTotals(line);
    const rate = parseVatRateForTotals(line.vatRate);
    const current = buckets.get(rate) ?? { base: 0, amount: 0 };

    buckets.set(rate, {
      base: current.base + totals.lineTotalHt,
      amount: current.amount + totals.lineVat,
    });
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => b - a)
    .map(([rate, values]) => ({
      rate: formatVatRate(rate),
      base: formatPriceHT(values.base),
      amount: formatPriceHT(values.amount),
    }));
}

/** Somme des remises de ligne : la seule remise que le modèle de données porte. */
function computeDiscount(input: PdfDocumentInput): number {
  return input.lines.reduce((sum, line) => sum + mapLineValueToTotals(line).discountAmount, 0);
}

function buildLegalMentions(input: PdfDocumentInput): string[] {
  // Uniquement le texte que l'utilisateur a lui-même configuré : aucune mention
  // réglementaire n'est inventée à sa place.
  const footer =
    input.kind === 'quote' ? input.settings?.quoteFooter : input.settings?.invoiceFooter;

  return (footer ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildQrSvg(input: PdfDocumentInput, amountDue: number): string | null {
  if (input.kind !== 'invoice' || input.showPaymentQr === false) {
    return null;
  }

  // Facture déjà soldée (vente encaissée avant émission : marketplace, paiement
  // à la commande, acompte total). Un QR de virement inviterait à payer deux fois.
  if (amountDue <= 0.005) {
    return null;
  }

  const result = buildSepaCreditTransferPayload({
    beneficiaryName: clean(input.company.companyName) ?? clean(
      [input.company.firstName, input.company.lastName].filter(Boolean).join(' '),
    ),
    iban: input.company.iban,
    bic: input.company.bic,
    amount: amountDue > 0 ? amountDue : null,
    remittance: `Facture ${input.number}`,
    currency: input.settings?.currency ?? 'EUR',
  });

  if (result.status !== 'ok') {
    return null;
  }

  return renderQrCodeSvg(result.payload, {
    size: 200,
    title: `Virement SEPA — facture ${input.number}`,
  });
}

export function buildTemplateContext(input: PdfDocumentInput): TemplateContext {
  const isQuote = input.kind === 'quote';
  const totalTtc = input.totals.totalTtc;
  const amountDue = input.totals.amountDue ?? totalTtc;
  const deposit = totalTtc - amountDue;
  const discount = computeDiscount(input);
  const subtotalBeforeDiscount = input.totals.subtotalHt + discount;
  const paymentTermsDays = input.settings?.paymentTermsDays ?? null;

  const issuer = buildIssuer(input.company);
  const client = buildClient(input.client);
  const vat = buildVatRows(input);

  const iban = clean(input.company.iban);
  const bic = clean(input.company.bic);
  const methods = (input.company.paymentMethods ?? []).map(
    (id: PaymentMethodId) => PAYMENT_METHOD_LABELS[id],
  );
  // Solde nul sur une facture : le document est un justificatif, pas une demande
  // de paiement. On l'annonce au lieu d'un délai et on tait les coordonnées
  // bancaires, qui feraient payer une seconde fois.
  const settled = !isQuote && amountDue <= 0.005;
  const terms = isQuote
    ? null
    : settled
      ? 'Facture payée — aucun règlement attendu'
      : paymentTermsDays
        ? `Paiement sous ${paymentTermsDays} jours`
        : null;

  const issuedAt = input.issuedAt ? formatDate(input.issuedAt) : null;
  const secondaryDate = input.dueOrValidUntil ? formatDate(input.dueOrValidUntil) : null;

  const totalsRows: TemplateTotalsRow[] = [];

  if (discount > 0.005) {
    totalsRows.push({ label: 'Sous-total HT', value: formatPriceHT(subtotalBeforeDiscount) });
    totalsRows.push({ label: 'Remise', value: `− ${formatPriceHT(discount)}` });
  }

  totalsRows.push({ label: 'Total HT', value: formatPriceHT(input.totals.subtotalHt) });
  vat.forEach((row) => totalsRows.push({ label: `TVA ${row.rate}`, value: row.amount }));

  const meta: TemplateMetaEntry[] = [];

  if (issuedAt) {
    meta.push({ label: "Date d'émission", value: issuedAt });
  }

  if (secondaryDate) {
    meta.push({
      label: isQuote ? 'Validité' : 'Échéance',
      value: secondaryDate,
      strong: true,
    });
  }

  if (terms) {
    meta.push({ label: 'Conditions', value: terms });
  }

  const summaryParts = [
    terms,
    settled || !iban ? null : `IBAN ${formatIban(iban)}`,
    settled || !bic ? null : `BIC ${bic}`,
  ].filter((part): part is string => Boolean(part));

  const documentLabel = clean(input.documentTitle) ?? (isQuote ? 'Devis' : 'Facture');
  const paid = !isQuote && (input.status === 'paid' || Boolean(input.paidAt) || settled);

  return {
    kind: input.kind,
    labels: {
      document: documentLabel,
      documentUpper: documentLabel.toLocaleUpperCase('fr-FR'),
      number: 'N°',
      issuedAt: "Date d'émission",
      secondaryDate: isQuote ? 'Validité' : 'Échéance',
      amountDue: isQuote ? 'Total du devis' : 'Net à payer',
      designation: 'Désignation',
      quantity: 'Qté',
      unitPrice: 'P.U. HT',
      vat: 'TVA',
      totalHt: 'Total HT',
      billedTo: isQuote ? 'Destinataire' : 'Facturé à',
      issuer: 'Émetteur',
      payment: isQuote ? 'Modalités' : 'Règlement',
      signature: 'Bon pour accord, date et signature',
    },
    number: input.number,
    issuedAt,
    secondaryDate,
    issuer,
    client,
    logoUrl: input.company.logoUrl ?? null,
    lines: buildLines(input),
    meta,
    totals: {
      rows: totalsRows,
      vat,
      subtotalHt: formatPriceHT(input.totals.subtotalHt),
      totalHt: formatPriceHT(input.totals.subtotalHt),
      totalVat: formatPriceHT(input.totals.totalVat),
      totalTtc: formatPriceHT(totalTtc),
      amountDue: formatPriceHT(amountDue),
      discount: discount > 0.005 ? `− ${formatPriceHT(discount)}` : null,
      deposit: deposit > 0.005 ? `− ${formatPriceHT(deposit)}` : null,
    },
    payment: {
      terms,
      iban: settled || !iban ? null : formatIban(iban),
      bic: settled ? null : bic,
      methods: settled ? [] : methods,
      summary: summaryParts.length > 0 ? summaryParts.join(' — ') : null,
    },
    qrSvg: buildQrSvg(input, amountDue),
    legalMentions: buildLegalMentions(input),
    notes: clean(input.notes),
    signature: input.company.signatureUrl
      ? { url: input.company.signatureUrl, caption: 'Signature' }
      : null,
    clientSignature: input.clientSignature
      ? {
          url: input.clientSignature.url,
          caption: `Signé électroniquement le ${formatDateTimeForPdf(input.clientSignature.signedAt)}`,
        }
      : null,
    showApprovalBlock: isQuote && !input.clientSignature,
    status: input.status ? (STATUS_PILLS[input.status] ?? null) : null,
    issuerLegalIds: buildIssuerLegalIds(input),
    paidStamp: paid
      ? {
          companyName: issuer.name,
          date: input.paidAt ? formatDate(input.paidAt) : null,
        }
      : null,
  };
}
