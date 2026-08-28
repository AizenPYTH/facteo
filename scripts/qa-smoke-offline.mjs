import { hasClientIdentity } from '../src/lib/clients/identity.ts';
import { clientFormSchema } from '../src/lib/validations/client.ts';
import {
  offlineCreateClient,
  offlineCreateCompany,
  offlineCreateInvoice,
  offlineCreateQuote,
  offlineDeleteDocumentSignature,
  offlineGetDocumentSignature,
  offlineListCompanies,
  offlineUpsertDocumentSignature,
} from '../src/lib/screenshot-demo/offline-store.ts';
import { DEMO_USER_ID } from '../src/lib/screenshot-demo/fixtures.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(hasClientIdentity({ company: 'Acme' }) === true, 'company alone');
assert(hasClientIdentity({ lastName: 'Dupont', firstName: 'Jean' }) === true, 'name+first');
assert(hasClientIdentity({ lastName: 'Dupont' }) === false, 'last only');
assert(hasClientIdentity({ firstName: 'Jean' }) === false, 'first only');
assert(hasClientIdentity({}) === false, 'empty');

assert(
  clientFormSchema.safeParse({
    lastName: '',
    firstName: '',
    company: 'Acme',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    siren: '',
    siret: '',
    vatNumber: '',
    notes: '',
  }).success,
  'zod company',
);
assert(
  clientFormSchema.safeParse({
    lastName: 'Dupont',
    firstName: 'Jean',
    company: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    siren: '',
    siret: '',
    vatNumber: '',
    notes: '',
  }).success,
  'zod name+first',
);
assert(
  !clientFormSchema.safeParse({
    lastName: 'Dupont',
    firstName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    siren: '',
    siret: '',
    vatNumber: '',
    notes: '',
  }).success,
  'zod last only rejected',
);

const companyId = offlineCreateCompany('Studio Nord');
assert(offlineListCompanies().some((c) => c.id === companyId), 'company listed');

const client = offlineCreateClient({
  lastName: '',
  firstName: '',
  company: 'Petit Studio',
  email: 'c@petit-studio.fr',
  phone: '0611223344',
  address: '1 rue A',
  postalCode: '69001',
  city: 'Lyon',
  country: 'France',
  siren: '',
  siret: '',
  vatNumber: '',
  notes: '',
});

let rejected = false;
try {
  offlineCreateClient({
    lastName: 'Seul',
    firstName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    siren: '',
    siret: '',
    vatNumber: '',
    notes: '',
  });
} catch {
  rejected = true;
}
assert(rejected, 'invalid identity rejected');

const quote = offlineCreateQuote({
  clientId: client.id,
  lines: [
    {
      id: 'l1',
      productId: null,
      description: 'Presta',
      quantity: '1',
      unit: 'u',
      unitPrice: '100',
      vatRate: '20',
      discountPercent: '0',
    },
  ],
});

const invoice = offlineCreateInvoice(
  {
    clientId: client.id,
    lines: [
      {
        id: 'l1',
        productId: null,
        description: 'Presta',
        quantity: '1',
        unit: 'u',
        unitPrice: '100',
        vatRate: '20',
        discountPercent: '0',
      },
    ],
  },
  '2026-09-01T00:00:00.000Z',
);

const sig = offlineUpsertDocumentSignature({
  userId: DEMO_USER_ID,
  documentType: 'invoice',
  documentId: invoice.id,
  signatureUrl: 'data:image/png;base64,aaa',
  signerName: 'Client',
});
assert(offlineGetDocumentSignature('invoice', invoice.id)?.id === sig.id, 'sig saved');
offlineDeleteDocumentSignature('invoice', invoice.id);
assert(offlineGetDocumentSignature('invoice', invoice.id) === null, 'sig cleared');

console.log(
  JSON.stringify(
    {
      ok: true,
      company: companyId,
      client: client.company,
      quote: quote.number,
      invoice: invoice.number,
      signature: true,
      identity: true,
    },
    null,
    2,
  ),
);
