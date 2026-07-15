export function parseDecimalInput(value: string): number {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  return Number.parseFloat(normalized);
}
