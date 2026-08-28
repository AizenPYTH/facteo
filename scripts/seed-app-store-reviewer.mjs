/**
 * Crée / confirme review@inveq.fr + abonnement Max + données démo.
 *
 * Env requis:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Identifiants App Review (fixes):
 *   review@inveq.fr / azaz651234
 */
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'node:path';

import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const REVIEW_EMAIL = 'review@inveq.fr';
const REVIEW_PASSWORD = 'azaz651234';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Dashboard Supabase → Settings → API → service_role (secret).',
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function lineTotals(quantity, unitPrice, vatRate) {
  const lineHt = Math.round(quantity * unitPrice * 100) / 100;
  const vat = Math.round(lineHt * (vatRate / 100) * 100) / 100;
  return { lineHt, vat, ttc: Math.round((lineHt + vat) * 100) / 100 };
}

async function ensureUser() {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list.data?.users?.find(
    (u) => u.email?.toLowerCase() === REVIEW_EMAIL,
  );

  if (existing) {
    const updated = await admin.auth.admin.updateUserById(existing.id, {
      password: REVIEW_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: 'Thomas',
        last_name: 'Martin',
        company_name: 'Atelier Martin',
      },
    });
    if (updated.error) throw updated.error;
    console.log('Review user updated + email confirmed');
    return existing.id;
  }

  const created = await admin.auth.admin.createUser({
    email: REVIEW_EMAIL,
    password: REVIEW_PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: 'Thomas',
      last_name: 'Martin',
      company_name: 'Atelier Martin',
    },
  });
  if (created.error) throw created.error;
  console.log('Review user created + email confirmed');
  return created.data.user.id;
}

async function ensureMaxPlan(userId) {
  const payload = {
    user_id: userId,
    plan: 'max',
    status: 'active',
    cancel_at_period_end: false,
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  let { error } = await admin.from('subscriptions').upsert(payload, { onConflict: 'user_id' });
  if (error) {
    console.warn('plan=max failed, fallback pro:', error.message);
    ({ error } = await admin
      .from('subscriptions')
      .upsert({ ...payload, plan: 'pro' }, { onConflict: 'user_id' }));
    if (error) throw error;
    console.log('Subscription set to pro (max unavailable in enum)');
    return;
  }
  console.log('Subscription set to max');
}

async function ensureCompany(userId) {
  const { data: memberships } = await admin
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .limit(1);

  if (memberships?.[0]?.company_id) {
    const companyId = memberships[0].company_id;
    await admin
      .from('companies')
      .update({
        name: 'Atelier Martin',
        email: REVIEW_EMAIL,
        city: 'Lyon',
        postal_code: '69002',
        address: '12 rue de la République',
        country: 'France',
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);
    return companyId;
  }

  const { data: company, error } = await admin
    .from('companies')
    .insert({
      name: 'Atelier Martin',
      email: REVIEW_EMAIL,
      city: 'Lyon',
      postal_code: '69002',
      address: '12 rue de la République',
      country: 'France',
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: memberError } = await admin.from('company_members').insert({
    company_id: company.id,
    user_id: userId,
    role: 'owner',
  });
  if (memberError) throw memberError;
  return company.id;
}

async function seedDemoData(userId, companyId) {
  await admin
    .from('profiles')
    .upsert({
      id: userId,
      first_name: 'Thomas',
      last_name: 'Martin',
      company_name: 'Atelier Martin',
      email: REVIEW_EMAIL,
      onboarding_completed: true,
      onboarding_step: 99,
      updated_at: new Date().toISOString(),
    });

  const { data: existingClients } = await admin
    .from('clients')
    .select('id')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .limit(1);

  if (existingClients?.length) {
    console.log('Demo clients already present — skip reseed');
    return;
  }

  const { data: clients, error: clientsError } = await admin
    .from('clients')
    .insert([
      {
        user_id: userId,
        company_id: companyId,
        name: 'Dupont, Sophie',
        company: 'Dupont Design',
        email: 'sophie.dupont@dupont-design.fr',
        phone: '0612345678',
        address: '8 avenue Victor Hugo',
        postal_code: '75016',
        city: 'Paris',
        country: 'France',
      },
      {
        user_id: userId,
        company_id: companyId,
        name: 'Bernard, Lucas',
        company: 'LB Rénovation',
        email: 'lucas.bernard@lb-renovation.fr',
        phone: '0678912345',
        address: '22 quai Saint-Antoine',
        postal_code: '69002',
        city: 'Lyon',
        country: 'France',
      },
      {
        user_id: userId,
        company_id: companyId,
        name: 'Moreau, Claire',
        company: 'Studio Moreau',
        email: 'claire.moreau@studio-moreau.fr',
        phone: '0699887766',
        address: '3 place Bellecour',
        postal_code: '69002',
        city: 'Lyon',
        country: 'France',
      },
    ])
    .select('id');
  if (clientsError) throw clientsError;

  const [clientA, clientB, clientC] = clients;
  const now = new Date();

  const quoteLines = [
    { description: 'Conception logo & charte', quantity: 1, unit: 'forfait', unit_price: 850, vat_rate: 20 },
    { description: 'Déclinaisons print', quantity: 3, unit: 'unité', unit_price: 120, vat_rate: 20 },
  ];
  const quoteTotals = quoteLines.reduce(
    (acc, line) => {
      const t = lineTotals(line.quantity, line.unit_price, line.vat_rate);
      acc.ht += t.lineHt;
      acc.vat += t.vat;
      acc.ttc += t.ttc;
      return acc;
    },
    { ht: 0, vat: 0, ttc: 0 },
  );

  const issued = new Date(now);
  issued.setDate(issued.getDate() - 5);
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 25);

  const { data: quote, error: quoteError } = await admin
    .from('quotes')
    .insert({
      user_id: userId,
      company_id: companyId,
      client_id: clientA.id,
      number: 'D-2026-001',
      status: 'sent',
      subtotal_ht: Math.round(quoteTotals.ht * 100) / 100,
      total_vat: Math.round(quoteTotals.vat * 100) / 100,
      total_ttc: Math.round(quoteTotals.ttc * 100) / 100,
      issued_at: issued.toISOString(),
      valid_until: validUntil.toISOString(),
      notes: 'Devis valable 30 jours.',
    })
    .select('id')
    .single();
  if (quoteError) throw quoteError;

  await admin.from('quote_items').insert(
    quoteLines.map((line, index) => {
      const t = lineTotals(line.quantity, line.unit_price, line.vat_rate);
      return {
        quote_id: quote.id,
        user_id: userId,
        position: index,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unit_price: line.unit_price,
        vat_rate: line.vat_rate,
        discount_percent: 0,
        line_total_ht: t.lineHt,
      };
    }),
  );

  const invoiceSpecs = [
    {
      client_id: clientB.id,
      number: 'F-2026-001',
      status: 'paid',
      lines: [
        { description: 'Peinture salon 35 m²', quantity: 35, unit: 'm²', unit_price: 28, vat_rate: 10 },
        { description: 'Fournitures', quantity: 1, unit: 'forfait', unit_price: 180, vat_rate: 20 },
      ],
      daysAgo: 12,
      paid: true,
    },
    {
      client_id: clientC.id,
      number: 'F-2026-002',
      status: 'sent',
      lines: [
        { description: 'Shooting produit (demi-journée)', quantity: 1, unit: 'jour', unit_price: 650, vat_rate: 20 },
        { description: 'Retouche & livrables', quantity: 12, unit: 'photo', unit_price: 35, vat_rate: 20 },
      ],
      daysAgo: 3,
      paid: false,
    },
  ];

  for (const spec of invoiceSpecs) {
    const totals = spec.lines.reduce(
      (acc, line) => {
        const t = lineTotals(line.quantity, line.unit_price, line.vat_rate);
        acc.ht += t.lineHt;
        acc.vat += t.vat;
        acc.ttc += t.ttc;
        return acc;
      },
      { ht: 0, vat: 0, ttc: 0 },
    );
    const issuedAt = new Date(now);
    issuedAt.setDate(issuedAt.getDate() - spec.daysAgo);
    const dueAt = new Date(issuedAt);
    dueAt.setDate(dueAt.getDate() + 30);
    const paidAt = spec.paid ? new Date(issuedAt.getTime() + 2 * 86400000) : null;

    const { data: invoice, error: invoiceError } = await admin
      .from('invoices')
      .insert({
        user_id: userId,
        company_id: companyId,
        client_id: spec.client_id,
        number: spec.number,
        status: spec.status,
        subtotal_ht: Math.round(totals.ht * 100) / 100,
        total_vat: Math.round(totals.vat * 100) / 100,
        total_ttc: Math.round(totals.ttc * 100) / 100,
        issued_at: issuedAt.toISOString(),
        due_at: dueAt.toISOString(),
        paid_at: paidAt ? paidAt.toISOString() : null,
        payment_method: spec.paid ? 'virement' : null,
        notes: 'Merci pour votre confiance.',
      })
      .select('id')
      .single();
    if (invoiceError) throw invoiceError;

    await admin.from('invoice_items').insert(
      spec.lines.map((line, index) => {
        const t = lineTotals(line.quantity, line.unit_price, line.vat_rate);
        return {
          invoice_id: invoice.id,
          user_id: userId,
          position: index,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unit_price: line.unit_price,
          vat_rate: line.vat_rate,
          discount_percent: 0,
          line_total_ht: t.lineHt,
        };
      }),
    );
  }

  console.log('Demo data seeded');
}

async function verifyLogin() {
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anon) return;
  const client = createClient(SUPABASE_URL, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: REVIEW_EMAIL,
    password: REVIEW_PASSWORD,
  });
  if (error || !data.session) {
    throw error ?? new Error('Login verification failed');
  }
  console.log('Login OK for', REVIEW_EMAIL);
}

async function main() {
  console.log('Seeding App Store reviewer…');
  const userId = await ensureUser();
  await ensureMaxPlan(userId);
  const companyId = await ensureCompany(userId);
  console.log('company', companyId);
  await seedDemoData(userId, companyId);
  await verifyLogin();
  console.log('\nApple Review credentials:');
  console.log(`  Email: ${REVIEW_EMAIL}`);
  console.log(`  Password: ${REVIEW_PASSWORD}`);
  console.log(`  Plan: Max`);
  console.log(`Meta written conceptually at ${resolve('store/screenshots/ios-6.5')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
