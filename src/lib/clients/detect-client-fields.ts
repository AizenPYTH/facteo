/** Local heuristics for live detection while pasting client text. */

export type DetectedClientHints = {
  phones: string[];
  emails: string[];
  vatNumbers: string[];
  ibans: string[];
  websites: string[];
  sirens: string[];
  sirets: string[];
  postalCodes: string[];
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+|00)?[\d][\d\s().-]{7,18}\d/g;
const VAT_RE = /\b([A-Z]{2})[.\s]?([A-Z0-9]{2,12})\b/gi;
const IBAN_RE = /\b([A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?)\b/gi;
const URL_RE = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9][-a-z0-9.]{1,60}\.[a-z]{2,}(?:\/\S*)?/gi;
const SIREN_RE = /\b(\d{3}[\s.]?\d{3}[\s.]?\d{3})\b/g;
const SIRET_RE = /\b(\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.]?\d{5})\b/g;
const POSTAL_FR_RE = /\b(\d{5})\b/g;
const POSTAL_PT_RE = /\b(\d{4}-\d{3})\b/g;

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.trim();
    if (!key || seen.has(key.toLowerCase())) {
      continue;
    }
    seen.add(key.toLowerCase());
    result.push(key);
  }
  return result;
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function detectClientFields(text: string): DetectedClientHints {
  const source = text ?? '';

  const emails = unique(source.match(EMAIL_RE) ?? []);
  const phones = unique(
    (source.match(PHONE_RE) ?? [])
      .map((p) => p.trim())
      .filter((p) => {
        const digits = normalizeDigits(p);
        return digits.length >= 8 && digits.length <= 15;
      }),
  );

  const vatNumbers = unique(
    [...source.matchAll(VAT_RE)].map((m) => `${m[1]}${m[2]}`.replace(/\s/g, '').toUpperCase()),
  );

  const ibans = unique(
    [...source.matchAll(IBAN_RE)].map((m) => m[1].replace(/\s/g, '').toUpperCase()),
  );

  const websites = unique(
    (source.match(URL_RE) ?? [])
      .map((u) => u.trim())
      .filter((u) => !u.includes('@') && /\.[a-z]{2,}/i.test(u)),
  );

  const sirets = unique(
    [...source.matchAll(SIRET_RE)].map((m) => normalizeDigits(m[1])).filter((d) => d.length === 14),
  );

  const sirens = unique(
    [...source.matchAll(SIREN_RE)]
      .map((m) => normalizeDigits(m[1]))
      .filter((d) => d.length === 9 && !sirets.some((s) => s.startsWith(d))),
  );

  const postalCodes = unique([
    ...(source.match(POSTAL_PT_RE) ?? []),
    ...(source.match(POSTAL_FR_RE) ?? []),
  ]);

  return {
    phones,
    emails,
    vatNumbers,
    ibans,
    websites,
    sirens,
    sirets,
    postalCodes,
  };
}

export function countLikelyClientBlocks(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  const blocks = trimmed
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 12);

  if (blocks.length >= 2) {
    return blocks.length;
  }

  const hints = detectClientFields(trimmed);
  const signalCount =
    (hints.emails.length > 0 ? 1 : 0) +
    (hints.phones.length > 0 ? 1 : 0) +
    (hints.vatNumbers.length > 0 ? 1 : 0) +
    (hints.websites.length > 0 ? 1 : 0);

  return signalCount > 0 || trimmed.length > 20 ? 1 : 0;
}
