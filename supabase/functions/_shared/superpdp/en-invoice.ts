/**
 * Build EN 16931 JSON (`en_invoice`) matching SUPER PDP OpenAPI v1.30.0.beta.
 * Source of truth: https://api.superpdp.tech/openapi/superpdp.json
 * Amounts are decimal strings.
 */

export type EnInvoiceInput = {
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string | null;
  currency?: string;
  seller: {
    name: string;
    street?: string | null;
    city?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    siret?: string | null;
    siren?: string | null;
    vatNumber?: string | null;
    email?: string | null;
    iban?: string | null;
    electronicAddress?: string | null;
  };
  buyer: {
    name: string;
    street?: string | null;
    city?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    siret?: string | null;
    siren?: string | null;
    vatNumber?: string | null;
    email?: string | null;
    electronicAddress?: string | null;
  };
  lines: Array<{
    id: string;
    name: string;
    quantity: number;
    unitCode?: string;
    unitPrice: number;
    vatRate: number;
    lineTotalHt: number;
  }>;
  notes?: string | null;
};

function money(value: number): string {
  return (Math.round((Number(value) + Number.EPSILON) * 100) / 100).toFixed(2);
}

function countryCode(country: string | null | undefined): string {
  if (!country) return 'FR';
  const c = country.trim().toUpperCase();
  if (c === 'FRANCE' || c === 'FR') return 'FR';
  if (c.length === 2) return c;
  return 'FR';
}

function vatCategory(rate: number): string {
  if (rate === 0) return 'Z';
  return 'S';
}

function sirenFrom(siret?: string | null, siren?: string | null): string | null {
  if (siren && /^\d{9}$/.test(siren)) return siren;
  if (siret && /^\d{14}$/.test(siret)) return siret.slice(0, 9);
  return siren || null;
}

function legalRegistration(siret?: string | null, siren?: string | null) {
  if (siret && /^\d{14}$/.test(siret)) {
    // ISO/IEC 6523: French SIRET
    return { value: siret, scheme: '0002' };
  }
  const s = sirenFrom(siret, siren);
  if (s) {
    // ISO/IEC 6523: French SIREN
    return { value: s, scheme: '0009' };
  }
  return null;
}

function postalAddress(party: {
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
}) {
  return {
    address_line1: party.street || undefined,
    city: party.city || undefined,
    post_code: party.postalCode || undefined,
    country_code: countryCode(party.countryCode),
  };
}

function frenchElectronicAddress(explicit: string | null | undefined, siren: string | null): {
  value: string;
  scheme: string;
} | null {
  if (explicit) {
    // Peppol FR scheme 0225 uses value like "0225:SIREN" or just identifier depending on API —
    // OpenAPI example for french_directory_entry.identifier: "0225:853322915"
    return { value: explicit.includes(':') ? explicit.split(':').slice(1).join(':') : explicit, scheme: '0225' };
  }
  if (siren) return { value: siren, scheme: '0225' };
  return null;
}

export function buildEnInvoice(input: EnInvoiceInput): Record<string, unknown> {
  const vatBuckets = new Map<number, { ht: number; vat: number }>();
  let sumHt = 0;

  const lines = input.lines.map((line, index) => {
    const ht = Number(line.lineTotalHt);
    const rate = Number(line.vatRate);
    const vat = (ht * rate) / 100;
    sumHt += ht;
    const bucket = vatBuckets.get(rate) ?? { ht: 0, vat: 0 };
    bucket.ht += ht;
    bucket.vat += vat;
    vatBuckets.set(rate, bucket);

    return {
      identifier: line.id || String(index + 1),
      invoiced_quantity: String(line.quantity),
      invoiced_quantity_code: line.unitCode || 'C62',
      net_amount: money(ht),
      item_information: { name: line.name },
      price_details: {
        item_net_price: money(line.unitPrice),
        quantity_unit_code: line.unitCode || 'C62',
      },
      vat_information: {
        invoiced_item_vat_category_code: vatCategory(rate),
        invoiced_item_vat_rate: money(rate),
      },
    };
  });

  let totalVat = 0;
  const vat_break_down = Array.from(vatBuckets.entries()).map(([rate, bucket]) => {
    totalVat += bucket.vat;
    return {
      vat_category_taxable_amount: money(bucket.ht),
      vat_category_tax_amount: money(bucket.vat),
      vat_category_code: vatCategory(rate),
      vat_category_rate: money(rate),
    };
  });

  const totalTtc = sumHt + totalVat;
  const sellerSiren = sirenFrom(input.seller.siret, input.seller.siren);
  const buyerSiren = sirenFrom(input.buyer.siret, input.buyer.siren);
  const sellerElectronic = frenchElectronicAddress(input.seller.electronicAddress, sellerSiren);
  const buyerElectronic = frenchElectronicAddress(input.buyer.electronicAddress, buyerSiren);

  if (!sellerElectronic) {
    throw new Error('Adresse électronique fournisseur manquante (SIREN requis).');
  }

  const seller: Record<string, unknown> = {
    name: input.seller.name,
    postal_address: postalAddress(input.seller),
    electronic_address: sellerElectronic,
  };
  const sellerLegal = legalRegistration(input.seller.siret, input.seller.siren);
  if (sellerLegal) seller.legal_registration_identifier = sellerLegal;
  if (input.seller.vatNumber) seller.vat_identifier = input.seller.vatNumber;
  if (input.seller.email) seller.contact = { email_address: input.seller.email };

  const buyer: Record<string, unknown> = {
    name: input.buyer.name,
    postal_address: postalAddress(input.buyer),
  };
  if (buyerElectronic) buyer.electronic_address = buyerElectronic;
  const buyerLegal = legalRegistration(input.buyer.siret, input.buyer.siren);
  if (buyerLegal) buyer.legal_registration_identifier = buyerLegal;
  if (input.buyer.vatNumber) buyer.vat_identifier = input.buyer.vatNumber;
  if (input.buyer.email) buyer.contact = { email_address: input.buyer.email };

  const doc: Record<string, unknown> = {
    number: input.invoiceNumber,
    issue_date: input.issueDate,
    type_code: 380,
    currency_code: input.currency || 'EUR',
    process_control: {
      specification_identifier: 'urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0',
    },
    seller,
    buyer,
    lines,
    totals: {
      sum_invoice_lines_amount: money(sumHt),
      total_without_vat: money(sumHt),
      total_vat_amount: { value: money(totalVat) },
      total_with_vat: money(totalTtc),
      amount_due_for_payment: money(totalTtc),
    },
    vat_break_down,
  };

  // French e-invoicing often uses CIUS FR; keep CEN baseline if FR CIUS id is not confirmed in OpenAPI.
  // Official docs mention AFNOR validation; specification_identifier above is EN16931-compatible.
  // Prefer FR extension when known — documented as configurable later if SUPER PDP mandates a specific CIUS.

  if (input.dueDate) doc.payment_due_date = input.dueDate;
  if (input.notes) {
    doc.notes = [{ content: input.notes }];
  }
  if (input.seller.iban) {
    doc.payment_instructions = {
      payment_means_type_code: '30',
      credit_transfers: [{ payment_account_identifier: input.seller.iban }],
    };
  }

  return doc;
}

export function validateEnInvoiceInputs(input: EnInvoiceInput): string[] {
  const errors: string[] = [];
  if (!input.invoiceNumber) errors.push('Numéro de facture manquant.');
  if (!input.issueDate) errors.push('Date d’émission manquante.');
  if (!input.seller.name) errors.push('Nom du fournisseur manquant.');
  if (!sirenFrom(input.seller.siret, input.seller.siren) && !input.seller.electronicAddress) {
    errors.push('SIREN/SIRET fournisseur manquant (adresse électronique requise).');
  }
  if (!input.buyer.name) errors.push('Nom du client manquant.');
  if (!input.lines.length) errors.push('Aucune ligne de facture.');
  for (const line of input.lines) {
    if (!line.name) errors.push('Description de ligne manquante.');
    if (!(line.quantity > 0)) errors.push(`Quantité invalide (${line.id}).`);
  }
  return errors;
}
