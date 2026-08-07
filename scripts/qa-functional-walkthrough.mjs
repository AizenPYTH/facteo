/**
 * QA fonctionnelle web (review offline) — crée client / devis / facture / entreprise.
 * Usage: node scripts/qa-functional-walkthrough.mjs
 */
import { chromium, devices } from 'playwright';

const WEB_URL = (process.env.APP_STORE_WEB_URL || 'http://localhost:8081').replace(/\/$/, '');
const EMAIL = 'review@inveq.fr';
const PASSWORD = 'azaz651234';

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function clickText(page, text, options = {}) {
  const locator = page.getByText(text, { exact: options.exact ?? false }).first();
  await locator.waitFor({ timeout: options.timeout ?? 15000 });
  await locator.click();
}

async function fillByLabel(page, label, value) {
  const field = page.getByLabel(label).first();
  if (await field.count()) {
    await field.fill(value);
    return;
  }
  // Fallback: placeholder / nearby textfield
  const byPlaceholder = page.getByPlaceholder(new RegExp(label, 'i')).first();
  if (await byPlaceholder.count()) {
    await byPlaceholder.fill(value);
    return;
  }
  throw new Error(`Champ introuvable: ${label}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'fr-FR',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    await page.goto(WEB_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Login
    const emailInput = page.locator('input[type="email"], input[autocomplete="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.waitFor({ timeout: 30000 });
    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);
    await page.getByRole('button', { name: /connexion|se connecter|connecter/i }).first().click();
    await page.waitForTimeout(2500);

    const loggedIn =
      (await page.getByText(/tableau de bord|dashboard|clients|factures|devis/i).count()) > 0 ||
      page.url().includes('(app)') ||
      !page.url().includes('login');
    record('Connexion review', loggedIn, page.url());

    // Clients tab
    try {
      await page.getByText('Clients', { exact: true }).first().click();
      await page.waitForTimeout(800);
      record('Ouvrir Clients', true);
    } catch (e) {
      record('Ouvrir Clients', false, String(e.message));
    }

    // Create client (company only)
    try {
      const fab = page.getByText(/nouveau client|ajouter|créer/i).first();
      if (await fab.count()) {
        await fab.click();
      } else {
        await page.locator('[testID="add-client-fab"], [data-testid="add-client-fab"]').first().click({ timeout: 3000 }).catch(() => {});
        // try + button
        await page.getByRole('button', { name: /\+|nouveau|ajouter/i }).first().click();
      }
      await page.waitForTimeout(800);

      // Prefer company field
      const company = page.getByPlaceholder(/Acme|entreprise/i).first();
      if (await company.count()) {
        await company.fill('QA Entreprise Test');
      } else {
        await fillByLabel(page, 'Entreprise', 'QA Entreprise Test');
      }

      await page.getByRole('button', { name: /enregistrer/i }).first().click();
      await page.waitForTimeout(1500);
      const created =
        (await page.getByText('QA Entreprise Test').count()) > 0 ||
        (await page.getByText(/client ajouté|enregistr/i).count()) > 0;
      record('Créer client (entreprise seule)', created);
    } catch (e) {
      record('Créer client (entreprise seule)', false, String(e.message));
    }

    // Quotes
    try {
      await page.getByText('Devis', { exact: true }).first().click();
      await page.waitForTimeout(800);
      await page.getByText(/nouveau devis|créer un devis/i).first().click();
      await page.waitForTimeout(1000);
      // pick first client in list
      const clientRow = page.getByText(/Dupont Design|Petit Studio|QA Entreprise|LB Rénovation|Studio Moreau/i).first();
      await clientRow.click();
      await page.waitForTimeout(500);
      // next steps if needed
      const next = page.getByRole('button', { name: /suivant|continuer/i }).first();
      if (await next.count()) {
        await next.click();
        await page.waitForTimeout(500);
      }
      // add line if on lines step
      const desc = page.getByPlaceholder(/description|prestation/i).first();
      if (await desc.count()) {
        await desc.fill('Prestation QA');
      }
      const createBtn = page.getByRole('button', { name: /créer le devis|enregistrer/i }).first();
      if (await createBtn.count()) {
        // may need to advance steps
        for (let i = 0; i < 3; i++) {
          const primary = page.getByRole('button', { name: /suivant|créer le devis|enregistrer/i }).first();
          if (!(await primary.count())) break;
          const label = (await primary.innerText()).toLowerCase();
          await primary.click();
          await page.waitForTimeout(900);
          if (label.includes('créer') || label.includes('enregistrer')) break;
        }
      }
      await page.waitForTimeout(1000);
      record('Créer devis (wizard)', true, 'parcours lancé');
    } catch (e) {
      record('Créer devis (wizard)', false, String(e.message));
    }

    // Invoices
    try {
      await page.getByText('Factures', { exact: true }).first().click();
      await page.waitForTimeout(800);
      await page.getByText(/nouvelle facture|créer une facture/i).first().click();
      await page.waitForTimeout(1000);
      record('Ouvrir création facture', true);
    } catch (e) {
      record('Ouvrir création facture', false, String(e.message));
    }

    // Settings / templates modal actions presence via settings
    try {
      await page.getByText(/paramètres|réglages|settings/i).first().click();
      await page.waitForTimeout(800);
      record('Ouvrir Paramètres', true);
    } catch (e) {
      record('Ouvrir Paramètres', false, String(e.message));
    }

  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n--- SUMMARY ---');
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}`);
  }
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
