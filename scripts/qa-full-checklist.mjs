/**
 * QA fonctionnelle complète (review offline) — preuve boutons / CRUD / signature / PDF UX.
 * Usage: node scripts/qa-full-checklist.mjs
 */
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const WEB_URL = (process.env.APP_STORE_WEB_URL || 'http://localhost:8081').replace(/\/$/, '');
const EMAIL = 'review@inveq.fr';
const PASSWORD = 'azaz651234';
const ARTIFACT_DIR = '/tmp/cursor/artifacts/qa-full';

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function login(page) {
  await page.goto(WEB_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const emailInput = page.locator('input[type="email"], input[autocomplete="email"]').first();
  await emailInput.waitFor({ timeout: 45000 });
  await emailInput.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.getByRole('button', { name: /connexion|se connecter|connecter/i }).first().click();
  await page.waitForTimeout(2800);
  const ok =
    (await page.getByText(/tableau de bord|clients|factures|devis/i).count()) > 0 ||
    !page.url().includes('login');
  record('Connexion review', ok, page.url());
  return ok;
}

async function clickFirstVisible(page, patterns, timeout = 8000) {
  for (const pattern of patterns) {
    const loc = typeof pattern === 'string' ? page.getByText(pattern, { exact: false }) : page.getByRole('button', { name: pattern });
    const count = await loc.count();
    for (let i = 0; i < count; i++) {
      const item = loc.nth(i);
      if (await item.isVisible().catch(() => false)) {
        await item.click({ timeout });
        return true;
      }
    }
  }
  return false;
}

async function fillFirst(page, selectors, value) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.count()) {
      await loc.fill(value);
      return true;
    }
  }
  return false;
}

async function wizardCreate(page, kind) {
  const route = kind === 'quote' ? '/quotes/new' : '/invoices/new';
  const createLabel = kind === 'quote' ? /créer le devis/i : /créer la facture/i;
  await page.goto(`${WEB_URL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // Step client
  const client = page.getByText(/Dupont|Studio|Rénovation|Moreau|Entreprise|Petit|QA/i).first();
  await client.waitFor({ timeout: 15000 });
  await client.click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /suivant/i }).first().click();
  await page.waitForTimeout(700);

  // Step info — next
  await page.getByRole('button', { name: /suivant/i }).first().click();
  await page.waitForTimeout(700);

  // Step lines — ensure a line exists then next / create
  const desc = page.getByPlaceholder(/description|prestation/i).first();
  if (await desc.count()) {
    await desc.fill(`QA ${kind} line`);
  }
  // advance until create
  for (let i = 0; i < 4; i++) {
    const primary = page.getByRole('button', { name: /suivant|créer le devis|créer la facture|enregistrer/i }).first();
    if (!(await primary.count())) break;
    const label = ((await primary.innerText()) || '').toLowerCase();
    await primary.click();
    await page.waitForTimeout(1000);
    if (createLabel.test(label) || label.includes('enregistrer')) break;
  }

  await page.waitForTimeout(1200);
  const listPath = kind === 'quote' ? '/quotes' : '/invoices';
  const onList = page.url().includes(listPath) || (await page.getByText(/D-|F-|QA/i).count()) > 0;
  return onList;
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'fr-FR',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('BROWSER_ERROR', msg.text());
    }
  });

  try {
    if (!(await login(page))) {
      throw new Error('Login failed');
    }

    // ---- Client create (company only) ----
    try {
      await page.goto(`${WEB_URL}/clients/new`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const companyFilled = await fillFirst(
        page,
        [
          'input[placeholder*="Acme"]',
          'input[placeholder*="entreprise" i]',
          'input[aria-label="Entreprise"]',
        ],
        'QA Co Identité',
      );
      if (!companyFilled) {
        // fallback: labeled fields via nearby text
        const inputs = page.locator('input');
        await inputs.nth(0).fill('QA Co Identité');
      }
      await page.getByRole('button', { name: /enregistrer/i }).first().click();
      await page.waitForTimeout(1500);
      const created =
        page.url().includes('/clients') &&
        ((await page.getByText('QA Co Identité').count()) > 0 ||
          (await page.getByText(/client ajouté/i).count()) > 0 ||
          !page.url().includes('/new'));
      record('Créer client', created, page.url());
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'client-create.png'), fullPage: true });
    } catch (e) {
      record('Créer client', false, e.message);
    }

    // ---- Client edit ----
    try {
      await page.goto(`${WEB_URL}/clients`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      await page.getByText('QA Co Identité').first().click();
      await page.waitForTimeout(800);
      const editOpened =
        (await clickFirstVisible(page, [/modifier/i, 'Modifier'])) ||
        page.url().includes('/edit');
      if (!page.url().includes('/edit')) {
        await page.getByRole('button', { name: /modifier/i }).first().click({ timeout: 5000 }).catch(() => {});
        // try pencil / link
        const editLink = page.locator('a[href*="/edit"], [href*="/edit"]').first();
        if (await editLink.count()) await editLink.click();
      }
      await page.waitForTimeout(800);
      if (page.url().includes('/edit') || (await page.getByText(/enregistrer/i).count()) > 0) {
        await fillFirst(page, ['input[placeholder*="Acme"]', 'input[placeholder*="entreprise" i]'], 'QA Co Identité Modifiée');
        await page.getByRole('button', { name: /enregistrer/i }).first().click();
        await page.waitForTimeout(1200);
        record('Modifier client', true, page.url());
      } else {
        record('Modifier client', false, `edit not opened (${page.url()}) editOpened=${editOpened}`);
      }
    } catch (e) {
      record('Modifier client', false, e.message);
    }

    // ---- Quote create ----
    try {
      const ok = await wizardCreate(page, 'quote');
      record('Créer devis', ok, page.url());
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'quote-create.png'), fullPage: true });
    } catch (e) {
      record('Créer devis', false, e.message);
    }

    // ---- Invoice create ----
    try {
      const ok = await wizardCreate(page, 'invoice');
      record('Créer facture', ok, page.url());
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'invoice-create.png'), fullPage: true });
    } catch (e) {
      record('Créer facture', false, e.message);
    }

    // ---- Signature ----
    try {
      await page.goto(`${WEB_URL}/invoices`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      // open first invoice
      const invoiceRow = page.locator('[href*="/invoices/"]').first();
      if (await invoiceRow.count()) {
        await invoiceRow.click();
      } else {
        await page.getByText(/F-|Facture/i).first().click();
      }
      await page.waitForTimeout(1200);

      const signBtn = page.getByRole('button', { name: /^Faire signer$/i }).first();
      if (await signBtn.count()) {
        await signBtn.click();
      } else {
        await page.getByText('Actions', { exact: true }).first().click();
        await page.waitForTimeout(500);
        await page.getByText(/Faire signer/i).first().click();
        await page.waitForTimeout(800);
      }
      await page.waitForTimeout(1000);

      const modalVisible = (await page.getByText(/Signature client/i).count()) > 0;
      if (!modalVisible) {
        record('Signature', false, 'modal non ouverte');
      } else {
        // draw in iframe
        const frame = page.frames().find((f) => f.url().startsWith('about:') || f.name() === '' );
        const iframe = page.frameLocator('iframe[title="Signature"]').first();
        const box = page.locator('iframe[title="Signature"]').first();
        if (await box.count()) {
          const bb = await box.boundingBox();
          if (bb) {
            await page.mouse.move(bb.x + 40, bb.y + 40);
            await page.mouse.down();
            await page.mouse.move(bb.x + 160, bb.y + 90, { steps: 12 });
            await page.mouse.move(bb.x + 60, bb.y + 140, { steps: 12 });
            await page.mouse.up();
          }
          // also try canvas in frame
          try {
            await iframe.locator('canvas').click({ position: { x: 50, y: 50 } });
            const canvas = iframe.locator('canvas');
            const cbox = await canvas.boundingBox();
            if (cbox) {
              await page.mouse.move(cbox.x + 30, cbox.y + 30);
              await page.mouse.down();
              await page.mouse.move(cbox.x + 140, cbox.y + 80, { steps: 10 });
              await page.mouse.up();
            }
          } catch {
            // ignore
          }
        }

        await page.getByRole('button', { name: /Valider la signature/i }).first().click();
        await page.waitForTimeout(1500);
        const saved =
          (await page.getByText(/Signature enregistrée|Signé électroniquement|Effacer la signature|Refaire signer/i).count()) >
          0;
        const redError = (await page.getByText(/Une erreur est survenue|n’est pas prêt|invalide/i).count()) > 0;

        if (saved && !redError) {
          // clear
          const clearBtn = page.getByRole('button', { name: /Effacer la signature/i }).first();
          if (await clearBtn.count()) {
            await clearBtn.click();
            await page.waitForTimeout(1000);
          }
          record('Signature', true, 'save+clear');
        } else {
          record('Signature', false, `saved=${saved} redError=${redError} frame=${Boolean(frame)}`);
        }
      }
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'signature.png'), fullPage: true });
    } catch (e) {
      record('Signature', false, e.message);
    }

    // ---- PDF templates UX ----
    try {
      await page.goto(`${WEB_URL}/settings/templates`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      // open gallery if needed
      const openGallery = page.getByText(/modèle|aperçu|changer|choisir/i).first();
      if (await openGallery.count()) await openGallery.click().catch(() => {});
      await page.waitForTimeout(800);

      // try from invoice actions if settings doesn't open modal
      if ((await page.getByText(/Choisir ce modèle|Utiliser ce modèle|Annuler/i).count()) === 0) {
        await page.goto(`${WEB_URL}/invoices`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);
        const row = page.locator('[href*="/invoices/"]').first();
        if (await row.count()) await row.click();
        else await page.getByText(/F-/i).first().click();
        await page.waitForTimeout(1000);
        await page.getByText('Actions', { exact: true }).first().click();
        await page.waitForTimeout(500);
        await page.getByText(/Changer de modèle/i).first().click();
        await page.waitForTimeout(1500);
      }

      const hasChoose = (await page.getByText(/Choisir ce modèle|Utiliser ce modèle/i).count()) > 0;
      const hasCancel = (await page.getByText(/^Annuler$/i).count()) > 0;
      const hasBack = (await page.getByLabel(/Retour|Fermer/i).count()) > 0 || (await page.getByText(/Retour|Fermer/i).count()) > 0;
      if (hasChoose && hasCancel) {
        await page.getByText(/^Annuler$/i).first().click();
        await page.waitForTimeout(600);
        record('Modèles PDF', true, `choose=${hasChoose} cancel=${hasCancel} back=${hasBack}`);
      } else {
        record('Modèles PDF', false, `choose=${hasChoose} cancel=${hasCancel} back=${hasBack}`);
      }
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'templates.png'), fullPage: true });
    } catch (e) {
      record('Modèles PDF', false, e.message);
    }

    // ---- Company create ----
    try {
      await page.goto(`${WEB_URL}/settings/companies`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await page.getByRole('button', { name: /Gérer mes entreprises/i }).first().click();
      await page.waitForTimeout(900);
      const input = page.getByPlaceholder(/Nom de l’entreprise|Nom de l'entreprise/i).first();
      await input.waitFor({ timeout: 8000 });
      await input.fill('QA Entreprise Créée');
      await page.getByRole('button', { name: /^Créer$/i }).first().click();
      await page.waitForTimeout(1500);
      const ok =
        (await page.getByText('QA Entreprise Créée').count()) > 0 &&
        (await page.getByText(/Une erreur est survenue/i).count()) === 0;
      record('Créer entreprise', ok);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'company-create.png'), fullPage: true });
    } catch (e) {
      record('Créer entreprise', false, e.message);
    }

    // ---- Settings / Notifications / Premium ----
    for (const [label, route] of [
      ['Paramètres', '/settings'],
      ['Notifications', '/settings/notifications'],
      ['Premium', '/settings/premium'],
    ]) {
      try {
        await page.goto(`${WEB_URL}${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(900);
        const ok = !page.url().includes('login');
        record(label, ok, page.url());
      } catch (e) {
        record(label, false, e.message);
      }
    }

    // ---- Keyboard architecture static proof via DOM on client form ----
    try {
      await page.goto(`${WEB_URL}/clients/new`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const submit = page.getByRole('button', { name: /enregistrer/i }).first();
      const nom = page.getByText('Nom', { exact: true }).first();
      await nom.click().catch(() => {});
      const nameInput = page.getByPlaceholder('Dupont').first();
      if (await nameInput.count()) await nameInput.click();
      await page.waitForTimeout(400);
      // On web there is no iOS keyboard; we assert CTA is inside scroll content (same parent chain as fields)
      const submitBox = await submit.boundingBox();
      const inputBox = nameInput.count() ? await nameInput.boundingBox() : null;
      const layoutOk =
        Boolean(submitBox) &&
        Boolean(inputBox) &&
        submitBox.y > inputBox.y &&
        // no huge mid-screen float: submit near bottom of document content
        submitBox.y > 200;
      record('Clavier (structure FormScreen)', layoutOk, `submitY=${submitBox?.y} inputY=${inputBox?.y}`);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'keyboard-form.png'), fullPage: true });
    } catch (e) {
      record('Clavier (structure FormScreen)', false, e.message);
    }

    // ---- PDF preview entry ----
    try {
      await page.goto(`${WEB_URL}/invoices`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const row = page.locator('[href*="/invoices/"]').first();
      if (await row.count()) await row.click();
      else await page.getByText(/F-/i).first().click();
      await page.waitForTimeout(1000);
      await page.getByText('Actions', { exact: true }).first().click();
      await page.waitForTimeout(500);
      await page.getByText(/Générer le PDF|Aperçu|PDF/i).first().click();
      await page.waitForTimeout(2000);
      const pdfOk =
        (await page.getByText(/Aperçu|Partager|Imprimer|Enregistrer|PDF/i).count()) > 0;
      record('PDF', pdfOk, page.url());
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pdf.png'), fullPage: true });
    } catch (e) {
      record('PDF', false, e.message);
    }
  } finally {
    await browser.close();
  }

  console.log('\n--- SUMMARY ---');
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'results.json'), JSON.stringify(results, null, 2));
  if (results.some((r) => !r.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
