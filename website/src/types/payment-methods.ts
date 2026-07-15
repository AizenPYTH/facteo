export const PAYMENT_METHOD_IDS = [
  'bank_transfer',
  'cash',
  'card',
  'cheque',
  'paypal',
  'stripe',
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, string> = {
  bank_transfer: 'Virement bancaire',
  cash: 'Espèces',
  card: 'Carte bancaire',
  cheque: 'Chèque',
  paypal: 'PayPal',
  stripe: 'Stripe',
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethodId[] = ['bank_transfer'];

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return (PAYMENT_METHOD_IDS as readonly string[]).includes(value);
}

export function normalizePaymentMethods(values: unknown): PaymentMethodId[] {
  if (!Array.isArray(values)) {
    return [...DEFAULT_PAYMENT_METHODS];
  }

  const normalized = values.filter(
    (value): value is PaymentMethodId =>
      typeof value === 'string' && isPaymentMethodId(value),
  );

  return normalized.length > 0 ? normalized : [...DEFAULT_PAYMENT_METHODS];
}
