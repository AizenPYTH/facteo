import type { InvoiceStatus } from '@/types/invoice';

const PAYMENT_EPSILON = 0.01;

export function isInvoicePastDue(dueAt: string | null, referenceDate = new Date()): boolean {
  if (!dueAt) {
    return false;
  }

  const due = new Date(dueAt);
  return !Number.isNaN(due.getTime()) && due.getTime() < referenceDate.getTime();
}

export function resolveInvoiceStatusFromPayments(params: {
  currentStatus: InvoiceStatus;
  totalTtc: number;
  amountPaid: number;
  dueAt: string | null;
}): InvoiceStatus {
  const { currentStatus, totalTtc, amountPaid, dueAt } = params;

  if (currentStatus === 'draft' || currentStatus === 'canceled') {
    return currentStatus;
  }

  if (amountPaid >= totalTtc - PAYMENT_EPSILON) {
    return 'paid';
  }

  const overdue = isInvoicePastDue(dueAt);

  if (amountPaid > PAYMENT_EPSILON) {
    return overdue ? 'overdue' : 'partially_paid';
  }

  if (overdue) {
    return 'overdue';
  }

  if (currentStatus === 'partially_paid' || currentStatus === 'overdue') {
    return 'sent';
  }

  return currentStatus === 'paid' ? 'sent' : currentStatus;
}
