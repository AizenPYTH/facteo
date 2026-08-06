import type { Client } from '@/types/client';
import type { Profile } from '@/types/database';
import type {
  DashboardStats,
  ExtendedDashboardData,
  Invoice as DashboardInvoice,
} from '@/types/dashboard';
import type { Invoice, InvoiceDetail } from '@/types/invoice';
import type { Quote } from '@/types/quote';
import type { Settings } from '@/types/settings';
import type {
  SubscriptionPlan,
  SubscriptionSnapshot,
  UserSubscription,
} from '@/types/subscription';
import type { TenantCompany } from '@/types/tenant';

export const DEMO_USER_ID = 'a1111111-1111-4111-8111-111111111111';
export const DEMO_COMPANY_ID = 'a2222222-2222-4222-8222-222222222222';
export const DEMO_SETTINGS_ID = 'a3333333-3333-4333-8333-333333333333';

export const DEMO_CLIENT_IDS = {
  dupont: 'b1111111-1111-4111-8111-111111111101',
  bernard: 'b1111111-1111-4111-8111-111111111102',
  moreau: 'b1111111-1111-4111-8111-111111111103',
} as const;

export const DEMO_QUOTE_ID = 'c1111111-1111-4111-8111-111111111201';
export const DEMO_INVOICE_IDS = {
  paid: 'd1111111-1111-4111-8111-111111111301',
  sent: 'd1111111-1111-4111-8111-111111111302',
  draft: 'd1111111-1111-4111-8111-111111111303',
} as const;

const NOW = '2026-08-01T10:00:00.000Z';

export const demoCompany: TenantCompany = {
  id: DEMO_COMPANY_ID,
  name: 'Atelier Martin',
  email: 'review@inveq.fr',
  phone: '0472123456',
  address: '12 rue de la République',
  postalCode: '69002',
  city: 'Lyon',
  country: 'France',
  siret: '12345678900012',
  vatNumber: 'FR12345678900',
  iban: null,
  bic: null,
  paymentMethods: ['bank_transfer', 'card'],
  logoUrl: null,
  signatureUrl: null,
  role: 'owner',
  createdAt: NOW,
  updatedAt: NOW,
};

export const demoProfile: Profile = {
  id: DEMO_USER_ID,
  first_name: 'Apple',
  last_name: 'Review',
  company_name: 'Atelier Martin',
  email: 'review@inveq.fr',
  phone: '0472123456',
  address: '12 rue de la République',
  postal_code: '69002',
  city: 'Lyon',
  country: 'France',
  siret: '12345678900012',
  vat_number: 'FR12345678900',
  iban: null,
  bic: null,
  payment_methods: ['bank_transfer', 'card'],
  logo_url: null,
  signature_url: null,
  avatar_url: null,
  activity_type: 'services',
  onboarding_completed: true,
  onboarding_step: 99,
  created_at: NOW,
  updated_at: NOW,
};

export const demoClients: Client[] = [
  {
    id: DEMO_CLIENT_IDS.dupont,
    lastName: 'Dupont',
    firstName: 'Sophie',
    company: 'Dupont Design',
    email: 'sophie.dupont@exemple.fr',
    phone: '0612345678',
    address: '8 avenue Victor Hugo',
    postalCode: '75016',
    city: 'Paris',
    country: 'France',
    siren: null,
    siret: null,
    vatNumber: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: DEMO_CLIENT_IDS.bernard,
    lastName: 'Bernard',
    firstName: 'Lucas',
    company: 'LB Rénovation',
    email: 'lucas.bernard@exemple.fr',
    phone: '0678912345',
    address: '22 quai Saint-Antoine',
    postalCode: '69002',
    city: 'Lyon',
    country: 'France',
    siren: null,
    siret: null,
    vatNumber: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: DEMO_CLIENT_IDS.moreau,
    lastName: 'Moreau',
    firstName: 'Claire',
    company: 'Studio Moreau',
    email: 'claire.moreau@exemple.fr',
    phone: '0699887766',
    address: '3 place Bellecour',
    postalCode: '69002',
    city: 'Lyon',
    country: 'France',
    siren: null,
    siret: null,
    vatNumber: null,
    notes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const demoQuotes: Quote[] = [
  {
    id: DEMO_QUOTE_ID,
    clientId: DEMO_CLIENT_IDS.dupont,
    clientName: 'Dupont Design',
    clientEmail: 'sophie.dupont@exemple.fr',
    convertedInvoiceId: null,
    number: 'D-2026-001',
    status: 'sent',
    subtotalHt: 1210,
    totalVat: 242,
    totalTtc: 1452,
    issuedAt: '2026-07-27T09:00:00.000Z',
    validUntil: '2026-08-26T09:00:00.000Z',
    paymentTermsDays: 30,
    notes: 'Devis valable 30 jours.',
    internalNotes: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const demoInvoices: Invoice[] = [
  {
    id: DEMO_INVOICE_IDS.paid,
    clientId: DEMO_CLIENT_IDS.bernard,
    clientName: 'LB Rénovation',
    clientEmail: 'lucas.bernard@exemple.fr',
    quoteId: null,
    number: 'F-2026-001',
    status: 'paid',
    subtotalHt: 1160,
    totalVat: 134,
    totalTtc: 1294,
    issuedAt: '2026-07-20T09:00:00.000Z',
    dueAt: '2026-08-19T09:00:00.000Z',
    paidAt: '2026-07-22T09:00:00.000Z',
    paymentMethod: 'virement',
    paymentReference: 'VIR-DEMO-001',
    notes: 'Merci pour votre confiance.',
    stripePaymentLink: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: DEMO_INVOICE_IDS.sent,
    clientId: DEMO_CLIENT_IDS.moreau,
    clientName: 'Studio Moreau',
    clientEmail: 'claire.moreau@exemple.fr',
    quoteId: null,
    number: 'F-2026-002',
    status: 'sent',
    subtotalHt: 1070,
    totalVat: 214,
    totalTtc: 1284,
    issuedAt: '2026-07-29T09:00:00.000Z',
    dueAt: '2026-08-28T09:00:00.000Z',
    paidAt: null,
    paymentMethod: null,
    paymentReference: null,
    notes: 'Merci pour votre confiance.',
    stripePaymentLink: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: DEMO_INVOICE_IDS.draft,
    clientId: DEMO_CLIENT_IDS.dupont,
    clientName: 'Dupont Design',
    clientEmail: 'sophie.dupont@exemple.fr',
    quoteId: null,
    number: 'F-2026-003',
    status: 'draft',
    subtotalHt: 1400,
    totalVat: 280,
    totalTtc: 1680,
    issuedAt: '2026-08-01T09:00:00.000Z',
    dueAt: '2026-08-31T09:00:00.000Z',
    paidAt: null,
    paymentMethod: null,
    paymentReference: null,
    notes: 'Merci pour votre confiance.',
    stripePaymentLink: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const demoInvoiceDetails: Record<string, InvoiceDetail> = {
  [DEMO_INVOICE_IDS.paid]: {
    ...demoInvoices[0],
    lines: [
      {
        id: 'line-paid-1',
        productId: null,
        description: 'Peinture salon 35 m²',
        quantity: '35',
        unit: 'm²',
        unitPrice: '28',
        vatRate: '10',
        discountPercent: '0',
      },
      {
        id: 'line-paid-2',
        productId: null,
        description: 'Fournitures',
        quantity: '1',
        unit: 'forfait',
        unitPrice: '180',
        vatRate: '20',
        discountPercent: '0',
      },
    ],
    payments: [
      {
        id: 'pay-1',
        invoiceId: DEMO_INVOICE_IDS.paid,
        amount: 1294,
        paidAt: '2026-07-22T09:00:00.000Z',
        paymentMethod: 'virement',
        paymentReference: 'VIR-DEMO-001',
        notes: null,
        createdAt: NOW,
      },
    ],
    amountPaid: 1294,
    amountDue: 0,
  },
  [DEMO_INVOICE_IDS.sent]: {
    ...demoInvoices[1],
    lines: [
      {
        id: 'line-sent-1',
        productId: null,
        description: 'Shooting produit (demi-journée)',
        quantity: '1',
        unit: 'jour',
        unitPrice: '650',
        vatRate: '20',
        discountPercent: '0',
      },
      {
        id: 'line-sent-2',
        productId: null,
        description: 'Retouche & livrables',
        quantity: '12',
        unit: 'photo',
        unitPrice: '35',
        vatRate: '20',
        discountPercent: '0',
      },
    ],
    payments: [],
    amountPaid: 0,
    amountDue: 1284,
  },
  [DEMO_INVOICE_IDS.draft]: {
    ...demoInvoices[2],
    lines: [
      {
        id: 'line-draft-1',
        productId: null,
        description: 'Refonte page d’accueil',
        quantity: '1',
        unit: 'forfait',
        unitPrice: '1400',
        vatRate: '20',
        discountPercent: '0',
      },
    ],
    payments: [],
    amountPaid: 0,
    amountDue: 1680,
  },
};

export const demoSettings: Settings = {
  id: DEMO_SETTINGS_ID,
  userId: DEMO_USER_ID,
  companyId: DEMO_COMPANY_ID,
  currency: 'EUR',
  defaultVatRate: 20,
  quotePrefix: 'D',
  invoicePrefix: 'F',
  quoteValidityDays: 30,
  nextQuoteNumber: 4,
  nextInvoiceNumber: 4,
  locale: 'fr-FR',
  paymentTermsDays: 30,
  quoteFooter: null,
  invoiceFooter: null,
  quoteTemplateId: 'classic-blue',
  invoiceTemplateId: 'classic-blue',
  createdAt: NOW,
  updatedAt: NOW,
};

export const demoDashboardStats: DashboardStats = {
  monthlyRevenue: 1294,
  weeklyRevenue: 1294,
  yearlyRevenue: 1294,
  unpaidInvoices: 1,
  paidInvoices: 1,
  totalClients: 3,
  todayRevenue: 0,
  outstandingInvoices: 1,
  outstandingAmount: 1284,
  lateInvoices: 0,
  pendingQuotes: 1,
  averagePaymentDelayDays: 2,
  averageInvoiceAmount: 1289,
};

export const demoExtendedDashboard: ExtendedDashboardData = {
  revenueByMonth: [
    { month: 'mars', amount: 980 },
    { month: 'avr.', amount: 1420 },
    { month: 'mai', amount: 1100 },
    { month: 'juin', amount: 1680 },
    { month: 'juil.', amount: 1294 },
    { month: 'août', amount: 0 },
  ],
  topClients: [
    { name: 'LB Rénovation', revenue: 1294 },
    { name: 'Studio Moreau', revenue: 0 },
    { name: 'Dupont Design', revenue: 0 },
  ],
  topPrestations: [
    { name: 'Peinture salon 35 m²', revenue: 980 },
    { name: 'Fournitures', revenue: 180 },
  ],
  recentActivity: [
    {
      id: DEMO_INVOICE_IDS.sent,
      type: 'invoice',
      label: 'Facture F-2026-002',
      date: '2026-07-29T09:00:00.000Z',
    },
    {
      id: DEMO_QUOTE_ID,
      type: 'quote',
      label: 'Devis D-2026-001',
      date: '2026-07-27T09:00:00.000Z',
    },
    {
      id: DEMO_INVOICE_IDS.paid,
      type: 'invoice',
      label: 'Facture F-2026-001',
      date: '2026-07-20T09:00:00.000Z',
    },
  ],
};

export const demoRecentInvoices: DashboardInvoice[] = demoInvoices.map((invoice) => ({
  id: invoice.id,
  number: invoice.number,
  clientName: invoice.clientName,
  amount: invoice.totalTtc,
  status: invoice.status,
  issuedAt: invoice.issuedAt ?? NOW,
}));

const DEMO_PLAN_FEATURES_MAX = {
  custom_logo: true,
  company_signature: true,
  client_signature: true,
  pdf_templates: true,
  stripe_payments: true,
  ai_assistant: true,
  advanced_stats: true,
  siren_search: true,
};

export const demoPlans: SubscriptionPlan[] = [
  {
    id: 'micro',
    displayName: 'Micro',
    description: 'Pour démarrer',
    sortOrder: 1,
    maxClients: null,
    maxQuotes: null,
    maxInvoices: null,
    maxDocumentsPerMonth: 3,
    maxSirenSearchesPerMonth: 0,
    maxCompanies: 1,
    features: {
      custom_logo: false,
      company_signature: false,
      client_signature: false,
      pdf_templates: false,
      stripe_payments: false,
      ai_assistant: false,
      advanced_stats: false,
      siren_search: false,
    },
    stripePriceId: null,
    stripeProductId: null,
    appStoreProductId: null,
    playStoreProductId: null,
    isActive: true,
  },
  {
    id: 'max',
    displayName: 'Max',
    description: 'Toutes les fonctionnalités INVEQ',
    sortOrder: 5,
    maxClients: null,
    maxQuotes: null,
    maxInvoices: null,
    maxDocumentsPerMonth: null,
    maxSirenSearchesPerMonth: null,
    maxCompanies: null,
    features: DEMO_PLAN_FEATURES_MAX,
    stripePriceId: null,
    stripeProductId: null,
    appStoreProductId: null,
    playStoreProductId: null,
    isActive: true,
  },
];

export const demoSubscription: UserSubscription = {
  userId: DEMO_USER_ID,
  plan: 'max',
  effectivePlanId: 'max',
  status: 'active',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodStart: '2026-07-01T00:00:00.000Z',
  currentPeriodEnd: '2027-07-01T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  trialEndsAt: null,
  createdAt: NOW,
  updatedAt: NOW,
};

export function getDemoSubscriptionSnapshot(): SubscriptionSnapshot {
  return {
    subscription: demoSubscription,
    plan: demoPlans[1],
    usage: {
      clients: demoClients.length,
      quotes: demoQuotes.length,
      invoices: demoInvoices.length,
      documents: demoQuotes.length + demoInvoices.length,
      companies: 1,
      sirenSearches: 0,
    },
  };
}

export function createDemoAuthUser(email: string, userId: string = DEMO_USER_ID) {
  return {
    id: userId,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      first_name: 'Apple',
      last_name: 'Review',
      company_name: 'Atelier Martin',
    },
    aud: 'authenticated',
    created_at: NOW,
    email,
    email_confirmed_at: NOW,
    phone: '',
    confirmed_at: NOW,
    last_sign_in_at: NOW,
    role: 'authenticated',
    updated_at: NOW,
    identities: [],
    is_anonymous: false,
    factors: [],
  };
}

export function createDemoSession(email: string, userId: string = DEMO_USER_ID) {
  const user = createDemoAuthUser(email, userId);
  return {
    access_token: 'screenshot-demo-access-token',
    refresh_token: 'screenshot-demo-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  };
}
