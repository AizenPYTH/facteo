/**
 * Payload « QR-code de paiement » au format EPC069-12 (European Payments Council),
 * aussi appelé EPC QR code / GiroCode. C'est le seul format de QR de virement
 * réellement interprété par les applications bancaires de la zone SEPA.
 *
 * Structure (12 lignes séparées par LF, 331 octets maximum, niveau de correction M) :
 *  1  Service Tag         « BCD »                       obligatoire
 *  2  Version             « 002 » (BIC facultatif)      obligatoire
 *  3  Jeu de caractères   « 1 » = UTF-8                 obligatoire
 *  4  Identification      « SCT »                       obligatoire
 *  5  BIC du bénéficiaire                               facultatif en version 002
 *  6  Nom du bénéficiaire (70 max)                      obligatoire
 *  7  IBAN du bénéficiaire (34 max)                     obligatoire
 *  8  Montant « EUR0.01 » à « EUR999999999.99 »         facultatif
 *  9  Code purpose (4 max)                              facultatif
 * 10  Référence structurée (35 max)                     facultatif (exclusif avec 11)
 * 11  Communication libre (140 max)                     facultatif (exclusif avec 10)
 * 12  Information bénéficiaire → donneur d'ordre (70)   facultatif
 *
 * Rien n'est inventé ici : si les données obligatoires manquent, on ne produit
 * pas de QR code, on renvoie la liste de ce qui manque.
 */

export const SEPA_QR_MAX_BYTES = 331;
const SEPA_QR_MIN_AMOUNT = 0.01;
const SEPA_QR_MAX_AMOUNT = 999999999.99;

export type SepaQrInput = {
  beneficiaryName: string | null | undefined;
  iban: string | null | undefined;
  bic?: string | null;
  /** Montant restant dû, en euros. `null` => QR sans montant (saisie manuelle). */
  amount?: number | null;
  /** Communication libre : numéro de facture en général. */
  remittance?: string | null;
  currency?: string | null;
};

export type SepaQrMissingField = 'beneficiaryName' | 'iban' | 'currency';

export type SepaQrResult =
  | { status: 'ok'; payload: string }
  | { status: 'incomplete'; missing: SepaQrMissingField[] };

export function normalizeIban(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/** Contrôle ISO 7064 mod 97-10 : évite de produire un QR pointant vers un IBAN erroné. */
export function isValidIban(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const iban = normalizeIban(value);

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) {
    return false;
  }

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;

  for (const character of rearranged) {
    const code = character.charCodeAt(0);
    // '0'-'9' => 0-9, 'A'-'Z' => 10-35
    const digits = code >= 65 ? String(code - 55) : character;

    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder === 1;
}

export function isValidBic(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value.replace(/\s/g, '').toUpperCase());
}

function sanitizeLine(value: string, maxLength: number): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, maxLength);
}

function formatSepaAmount(amount: number): string | null {
  if (!Number.isFinite(amount)) {
    return null;
  }

  const rounded = Math.round(amount * 100) / 100;

  if (rounded < SEPA_QR_MIN_AMOUNT || rounded > SEPA_QR_MAX_AMOUNT) {
    return null;
  }

  return `EUR${rounded.toFixed(2)}`;
}

function utf8ByteLength(value: string): number {
  // Pas de TextEncoder garanti sur toutes les plateformes RN : on compte à la main.
  let bytes = 0;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.codePointAt(index) as number;

    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code <= 0xffff) {
      bytes += 3;
    } else {
      bytes += 4;
      index += 1;
    }
  }

  return bytes;
}

/**
 * Construit le payload EPC. Renvoie `incomplete` (et non une erreur) quand les
 * informations de paiement ne permettent pas un virement valide.
 */
export function buildSepaCreditTransferPayload(input: SepaQrInput): SepaQrResult {
  const missing: SepaQrMissingField[] = [];
  const beneficiaryName = sanitizeLine(input.beneficiaryName ?? '', 70);
  const iban = normalizeIban(input.iban ?? '');
  const currency = (input.currency ?? 'EUR').toUpperCase();

  if (!beneficiaryName) {
    missing.push('beneficiaryName');
  }

  if (!isValidIban(iban)) {
    missing.push('iban');
  }

  // Le format EPC ne transporte que des euros.
  if (currency !== 'EUR') {
    missing.push('currency');
  }

  if (missing.length > 0) {
    return { status: 'incomplete', missing };
  }

  const bic = isValidBic(input.bic) ? (input.bic as string).replace(/\s/g, '').toUpperCase() : '';
  const amount = input.amount == null ? null : formatSepaAmount(input.amount);

  let remittance = sanitizeLine(input.remittance ?? '', 140);

  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    bic,
    beneficiaryName,
    iban,
    amount ?? '',
    '',
    '',
    remittance,
    '',
  ];

  let payload = lines.join('\n');

  // Garde-fou : on tronque la communication plutôt que de dépasser la limite EPC.
  while (utf8ByteLength(payload) > SEPA_QR_MAX_BYTES && remittance.length > 0) {
    remittance = remittance.slice(0, Math.max(0, remittance.length - 8)).trim();
    lines[10] = remittance;
    payload = lines.join('\n');
  }

  if (utf8ByteLength(payload) > SEPA_QR_MAX_BYTES) {
    return { status: 'incomplete', missing: ['beneficiaryName'] };
  }

  return { status: 'ok', payload };
}
