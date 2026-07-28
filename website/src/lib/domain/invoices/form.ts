import { isoToFrenchDateInput } from '@/lib/format/date-input';
import {
  createEmptyInvoiceInfoValues,
  createLocalInvoiceLineId,
  type InvoiceDetail,
  type InvoiceInfoValues,
  type InvoiceLineValue,
  type VatRegime,
} from '@/types/invoice';

export type InvoiceWizardState = {
  clientId: string | null;
  clientName: string;
  lines: InvoiceLineValue[];
  info: InvoiceInfoValues;
  vatRegime: VatRegime;
  revision: number;
};

export function createEmptyInvoiceWizardState(): InvoiceWizardState {
  return {
    clientId: null,
    clientName: '',
    lines: [],
    info: createEmptyInvoiceInfoValues(),
    vatRegime: 'standard',
    revision: 1,
  };
}

export function mapInvoiceDetailToWizardState(invoice: InvoiceDetail): InvoiceWizardState {
  return {
    clientId: invoice.clientId,
    clientName: invoice.clientName,
    lines: invoice.lines.map((line) => ({
      ...line,
      id: line.id || createLocalInvoiceLineId(),
    })),
    info: createEmptyInvoiceInfoValues({
      issuedAt: isoToFrenchDateInput(invoice.issuedAt ?? invoice.createdAt),
      dueAt: isoToFrenchDateInput(invoice.dueAt),
      paymentTermsDays: '30',
      notes: invoice.notes ?? '',
    }),
    vatRegime: invoice.vatRegime,
    revision: invoice.revision,
  };
}
