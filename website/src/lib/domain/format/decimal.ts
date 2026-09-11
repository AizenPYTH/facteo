export function parseDecimalInput(value: string): number {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  return Number.parseFloat(normalized);
}

/** Empty TVA % is 0 — the user does not have to type 0. Invalid text stays NaN. */
export function parseVatRateInput(value: string): number {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) {
    return 0;
  }
  return Number.parseFloat(normalized);
}
