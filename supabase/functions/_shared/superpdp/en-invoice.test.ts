import { buildEnInvoice, validateEnInvoiceInputs } from './en-invoice.ts';

Deno.test('validates required seller siren/siret', () => {
  const errors = validateEnInvoiceInputs({
    invoiceNumber: 'F-1',
    issueDate: '2026-09-02',
    seller: { name: 'SNOWOLF' },
    buyer: { name: 'Client' },
    lines: [{ id: '1', name: 'Presta', quantity: 1, unitPrice: 100, vatRate: 20, lineTotalHt: 100 }],
  });
  if (!errors.some((e) => e.includes('SIREN'))) throw new Error('expected siren error');
});

Deno.test('builds official en_invoice shape with string amounts', () => {
  const doc = buildEnInvoice({
    invoiceNumber: 'F-2026-001',
    issueDate: '2026-09-02',
    dueDate: '2026-10-02',
    seller: {
      name: 'SNOWOLF',
      street: '1 rue Test',
      city: 'Paris',
      postalCode: '75001',
      countryCode: 'FR',
      siret: '12345678901234',
      vatNumber: 'FR12345678901',
      iban: 'FR7630001007941234567890185',
    },
    buyer: {
      name: 'Client SARL',
      street: '2 avenue X',
      city: 'Lyon',
      postalCode: '69001',
      countryCode: 'France',
      siren: '987654321',
      electronicAddress: '0225:987654321',
    },
    lines: [
      {
        id: '1',
        name: 'Conseil',
        quantity: 2,
        unitPrice: 50,
        vatRate: 20,
        lineTotalHt: 100,
      },
    ],
  });

  if (doc.number !== 'F-2026-001') throw new Error('number');
  if (doc.type_code !== 380) throw new Error('type_code');
  if (!(doc.process_control as { specification_identifier: string }).specification_identifier) {
    throw new Error('process_control');
  }
  const totals = doc.totals as Record<string, unknown>;
  if (totals.total_without_vat !== '100.00') throw new Error('ht');
  if (totals.total_with_vat !== '120.00') throw new Error('ttc');
  const seller = doc.seller as { electronic_address: { scheme: string; value: string } };
  if (seller.electronic_address.scheme !== '0225') throw new Error('seller ea scheme');
});
