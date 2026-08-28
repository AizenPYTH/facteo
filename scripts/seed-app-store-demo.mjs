/**
 * Crée / met à jour le compte démo App Store + données d’exemple.
 *
 * Env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   APP_STORE_DEMO_EMAIL (défaut: appstore-demo@inveq.fr)
 *   APP_STORE_DEMO_PASSWORD (défaut généré localement)
 *   SUPABASE_SERVICE_ROLE_KEY (recommandé — confirme l’email sans inbox)
 */
import { createClient } from '@supabase/supabase-js';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const DEMO_EMAIL = process.env.APP_STORE_DEMO_EMAIL?.trim() || 'appstore-demo@inveq.fr';
const DEMO_PASSWORD =
  process.env.APP_STORE_DEMO_PASSWORD?.trim() || 'InveqAppStoreDemo2026!';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

function persistDemoCredentials() {
  const envLocal = resolve(process.cwd(), '.env.local');
  const lines = [
    `APP_STORE_DEMO_EMAIL=${DEMO_EMAIL}`,
    `APP_STORE_DEMO_PASSWORD=${DEMO_PASSWORD}`,
  ];
  let existing = existsSync(envLocal) ? readFileSync(envLocal, 'utf8') : '';
  for (const line of lines) {
    const key = line.split('=')[0];
    if (existing.includes(`${key}=`)) {
      existing = existing.replace(new RegExp(`^${key}=.*$`, 'm'), line);
    } else {
      existing = `${existing.trimEnd()}\n${line}\n`;
    }
  }
  writeFileSync(envLocal, existing.startsWith('\n') ? existing.slice(1) : existing);
  console.log(`Credentials written to .env.local (${DEMO_EMAIL})`);
}

function lineTotals(quantity, unitPrice, vatRate) {
  const lineHt = Math.round(quantity * unitPrice * 100) / 100;
  const vat = Math.round(lineHt * (vatRate / 100) * 100) / 100;
  return { lineHt, vat, ttc: Math.round((lineHt + vat) * 100) / 100 };
}

async function ensureUser() {
  if (SERVICE_ROLE) {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list.data?.users?.find(
      (u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase(),
    );

    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: 'Camille',
          last_name: 'Martin',
          company_name: 'Atelier Martin',
        },
      });
      console.log('Demo user updated via service role');
      return existing.id;
    }

    const created = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: 'Camille',
        last_name: 'Martin',
        company_name: 'Atelier Martin',
      },
    });

    if (created.error) {
      throw created.error;
    }

    console.log('Demo user created via service role');
    return created.data.user.id;
  }

  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const signIn = await anon.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });

  if (signIn.data.user) {
    console.log('Demo user already exists (signed in)');
    return signIn.data.user.id;
  }

  const signUp = await anon.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    options: {
      data: {
        first_name: 'Camille',
        last_name: 'Martin',
        company_name: 'Atelier Martin',
      },
    },
  });

  if (signUp.error) {
    throw signUp.error;
  }

  if (!signUp.data.session) {
    const err = new Error(
      'Signup OK but email is not confirmed. Set SUPABASE_SERVICE_ROLE_KEY to confirm the demo user.',
    );
    err.code = 'EMAIL_NOT_CONFIRMED';
    throw err;
  }

  console.log('Demo user signed up via anon key');
  return signUp.data.user.id;
}

function writeFixtureMeta() {
  const metaPath = resolve(process.cwd(), 'store/screenshots/ios-6.5/demo-meta.json');
  writeFileSync(
    metaPath,
    JSON.stringify(
      {
        mode: 'screenshot-demo-fixtures',
        email: DEMO_EMAIL,
        companyId: 'a2222222-2222-4222-8222-222222222222',
        userId: 'a1111111-1111-4111-8111-111111111111',
        firstInvoiceId: 'd1111111-1111-4111-8111-111111111301',
        note:
          'Pas de SUPABASE_SERVICE_ROLE_KEY : utilisez EXPO_PUBLIC_SCREENSHOT_DEMO=1 pour les captures.',
      },
      null,
      2,
    ),
  );
  console.log(`Wrote fixture demo-meta.json → ${metaPath}`);
}

async function getAuthedClient() {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (error || !data.session) {
    throw error ?? new Error('Unable to sign in demo user');
  }
  return { client, userId: data.user.id };
}

async function resolveCompanyId(client, userId) {
  const { data: memberships, error } = await client
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .limit(1);

  if (error) throw error;

  if (memberships?.[0]?.company_id) {
    const companyId = memberships[0].company_id;
    await client
      .from('companies')
      .update({
        name: 'Atelier Martin',
        email: DEMO_EMAIL,
        city: 'Lyon',
        postal_code: '69002',
        address: '12 rue de la République',
        country: 'France',
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);
    return companyId;
  }

  const { data: companyId, error: rpcError } = await client.rpc('create_company_for_user', {
    p_name: 'Atelier Martin',
  });
  if (rpcError) throw rpcError;
  return companyId;
}

async function clearDemoData(client, companyId) {
  // Soft-delete / hard-delete children first where needed
  const { data: invoices } = await client
    .from('invoices')
    .select('id')
    .eq('company_id', companyId);
  const invoiceIds = (invoices ?? []).map((row) => row.id);
  if (invoiceIds.length) {
    await client.from('invoice_items').delete().in('invoice_id', invoiceIds);
    await client.from('invoice_payments').delete().in('invoice_id', invoiceIds);
    await client.from('invoices').delete().eq('company_id', companyId);
  }

  const { data: quotes } = await client.from('quotes').select('id').eq('company_id', companyId);
  const quoteIds = (quotes ?? []).map((row) => row.id);
  if (quoteIds.length) {
    await client.from('quote_items').delete().in('quote_id', quoteIds);
    await client.from('quotes').delete().eq('company_id', companyId);
  }

  await client.from('clients').delete().eq('company_id', companyId);
}

async function seedData(client, userId, companyId) {
  await client
    .from('profiles')
    .update({
      first_name: 'Camille',
      last_name: 'Martin',
      onboarding_completed: true,
      onboarding_step: 99,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  await client
    .from('settings')
    .update({
      quote_prefix: 'D',
      invoice_prefix: 'F',
      next_quote_number: 4,
      next_invoice_number: 4,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId);

  const clientsPayload = [
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
  ];

  const { data: clients, error: clientsError } = await client
    .from('clients')
    .insert(clientsPayload)
    .select('id, name, company');
  if (clientsError) throw clientsError;

  const [clientA, clientB, clientC] = clients;

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
  quoteTotals.ht = Math.round(quoteTotals.ht * 100) / 100;
  quoteTotals.vat = Math.round(quoteTotals.vat * 100) / 100;
  quoteTotals.ttc = Math.round(quoteTotals.ttc * 100) / 100;

  const now = new Date();
  const issued = new Date(now);
  issued.setDate(issued.getDate() - 5);
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 25);

  const { data: quote, error: quoteError } = await client
    .from('quotes')
    .insert({
      user_id: userId,
      company_id: companyId,
      client_id: clientA.id,
      number: 'D-2026-001',
      status: 'sent',
      subtotal_ht: quoteTotals.ht,
      total_vat: quoteTotals.vat,
      total_ttc: quoteTotals.ttc,
      issued_at: issued.toISOString(),
      valid_until: validUntil.toISOString(),
      notes: 'Devis valable 30 jours.',
    })
    .select('id')
    .single();
  if (quoteError) throw quoteError;

  const { error: quoteItemsError } = await client.from('quote_items').insert(
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
  if (quoteItemsError) throw quoteItemsError;

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
    {
      client_id: clientA.id,
      number: 'F-2026-003',
      status: 'draft',
      lines: [
        { description: 'Refonte page d’accueil', quantity: 1, unit: 'forfait', unit_price: 1400, vat_rate: 20 },
      ],
      daysAgo: 0,
      paid: false,
    },
  ];

  let firstInvoiceId = null;

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
    totals.ht = Math.round(totals.ht * 100) / 100;
    totals.vat = Math.round(totals.vat * 100) / 100;
    totals.ttc = Math.round(totals.ttc * 100) / 100;

    const issuedAt = new Date(now);
    issuedAt.setDate(issuedAt.getDate() - spec.daysAgo);
    const dueAt = new Date(issuedAt);
    dueAt.setDate(dueAt.getDate() + 30);
    const paidAt = spec.paid ? new Date(issuedAt.getTime() + 2 * 86400000) : null;

    const { data: invoice, error: invoiceError } = await client
      .from('invoices')
      .insert({
        user_id: userId,
        company_id: companyId,
        client_id: spec.client_id,
        number: spec.number,
        status: spec.status,
        subtotal_ht: totals.ht,
        total_vat: totals.vat,
        total_ttc: totals.ttc,
        issued_at: issuedAt.toISOString(),
        due_at: dueAt.toISOString(),
        paid_at: paidAt ? paidAt.toISOString() : null,
        payment_method: spec.paid ? 'virement' : null,
        notes: 'Merci pour votre confiance.',
      })
      .select('id')
      .single();
    if (invoiceError) throw invoiceError;

    if (!firstInvoiceId) firstInvoiceId = invoice.id;

    const { error: itemsError } = await client.from('invoice_items').insert(
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
    if (itemsError) throw itemsError;

    if (spec.paid) {
      const { error: paymentError } = await client.from('invoice_payments').insert({
        invoice_id: invoice.id,
        user_id: userId,
        amount: totals.ttc,
        paid_at: paidAt.toISOString(),
        payment_method: 'virement',
        payment_reference: 'VIR-DEMO-001',
      });
      if (paymentError) {
        console.warn('Payment insert skipped:', paymentError.message);
      }
    }
  }

  const metaPath = resolve(process.cwd(), 'store/screenshots/ios-6.5/demo-meta.json');
  writeFileSync(
    metaPath,
    JSON.stringify(
      {
        email: DEMO_EMAIL,
        companyId,
        userId,
        firstInvoiceId,
        clients: clients.map((c) => ({ id: c.id, name: c.name, company: c.company })),
      },
      null,
      2,
    ),
  );

  console.log(`Seed complete. firstInvoiceId=${firstInvoiceId}`);
  return firstInvoiceId;
}

async function main() {
  persistDemoCredentials();

  try {
    await ensureUser();
    const { client, userId } = await getAuthedClient();
    const companyId = await resolveCompanyId(client, userId);
    console.log(`Using company ${companyId}`);
    await clearDemoData(client, companyId);
    await seedData(client, userId, companyId);
    console.log('App Store demo ready (Supabase).');
  } catch (error) {
    const message = error?.message ?? String(error);
    const needsFixtures =
      error?.code === 'EMAIL_NOT_CONFIRMED' ||
      message.includes('email is not confirmed') ||
      message.includes('Unable to sign in demo user') ||
      !SERVICE_ROLE;

    if (!needsFixtures) {
      throw error;
    }

    console.warn(`Seed Supabase indisponible (${message}).`);
    console.warn('Fallback: meta fixtures pour EXPO_PUBLIC_SCREENSHOT_DEMO=1');
    writeFixtureMeta();
    console.log('App Store demo ready (fixtures mode).');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
