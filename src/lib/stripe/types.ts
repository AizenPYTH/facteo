export type StripePaymentStatus = 'pending' | 'processing' | 'succeeded' | 'canceled' | 'failed';

export type StripePaymentSession = {
  id: string;
  invoiceId: string;
  paymentLinkUrl: string | null;
  amount: number;
  currency: string;
  status: StripePaymentStatus;
  createdAt: string;
};

export type CreatePaymentLinkInput = {
  invoiceId: string;
  amount: number;
  currency?: string;
  allowPartialPayment?: boolean;
};

export type CreatePaymentLinkResult = {
  paymentLinkUrl: string;
  sessionId: string;
};
