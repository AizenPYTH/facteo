/**
 * Captures App Store iPhone 6.5" (1284×2778) via Expo web + Playwright.
 *
 * Prérequis:
 *   1. npm run screenshots:seed
 *   2. Expo web accessible (script peut le démarrer)
 *
 * Env:
 *   APP_STORE_DEMO_EMAIL / APP_STORE_DEMO_PASSWORD
 *   APP_STORE_WEB_URL (défaut http://localhost:8081)
 *   APP_STORE_START_WEB=1 pour démarrer `expo start --web` automatiquement
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, devices } from 'playwright';

import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const OUT_DIR = resolve(process.cwd(), 'store/screenshots/ios-6.5');
const META_PATH = resolve(OUT_DIR, 'demo-meta.json');
const WEB_URL = (process.env.APP_STORE_WEB_URL || 'http://localhost:8081').replace(/\/$/, '');
const EMAIL = process.env.APP_STORE_DEMO_EMAIL?.trim() || 'appstore-demo@inveq.fr';
const PASSWORD = process.env.APP_STORE_DEMO_PASSWORD?.trim() || 'InveqAppStoreDemo2026!';
const START_WEB = process.env.APP_STORE_START_WEB !== '0';
const USE_FIXTURES = process.env.EXPO_PUBLIC_SCREENSHOT_DEMO !== '0';

const VIEWPORT = { width: 428, height: 926 };
const DEVICE_SCALE_FACTOR = 3; // → 1284 × 2778

const FALLBACK_META = {
  mode: 'screenshot-demo-fixtures',
  email: EMAIL,
  firstInvoiceId: 'd1111111-1111-4111-8111-111111111301',
};

mkdirSync(OUT_DIR, { recursive: true });

function readMeta() {
  if (!existsSync(META_PATH)) {
    if (USE_FIXTURES) {
      writeFileSync(META_PATH, JSON.stringify(FALLBACK_META, null, 2));
      return FALLBACK_META;
    }
    throw new Error('Missing demo-meta.json — run npm run screenshots:seed first');
  }
  return JSON.parse(readFileSync(META_PATH, 'utf8'));
}

async function waitForServer(url, timeoutMs = 180_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status > 0) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startExpoWeb() {
  console.log('Starting Expo web…');
  const child = spawn('npx', ['expo', 'start', '--web', '--port', '8081'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
    env: {
      ...process.env,
      CI: '1',
      BROWSER: 'none',
      EXPO_NO_TELEMETRY: '1',
      ...(USE_FIXTURES
        ? {
            EXPO_PUBLIC_SCREENSHOT_DEMO: '1',
            EXPO_PUBLIC_APP_STORE_DEMO_EMAIL: EMAIL,
            EXPO_PUBLIC_APP_STORE_DEMO_PASSWORD: PASSWORD,
          }
        : {}),
    },
  });

  child.stdout?.on('data', (chunk) => {
    const text = String(chunk);
    if (text.includes('http://') || text.includes('Web is waiting')) {
      process.stdout.write(text);
    }
  });
  child.stderr?.on('data', (chunk) => process.stderr.write(chunk));

  await waitForServer(WEB_URL);
  return child;
}

async function dismissOverlays(page) {
  // Splash / cookies / toasts éventuels
  for (const label of ['Continuer', 'OK', 'Fermer', 'Compris']) {
    const btn = page.getByText(label, { exact: true }).first();
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.click().catch(() => {});
    }
  }
}

async function login(page) {
  await page.goto(`${WEB_URL}/login`, { waitUntil: 'networkidle', timeout: 120_000 });
  await dismissOverlays(page);

  // Déjà connecté ?
  if (!page.url().includes('login')) {
    console.log('Already authenticated, skipping login');
    return;
  }

  const email = page
    .getByPlaceholder('vous@entreprise.fr')
    .or(page.getByLabel('Adresse e-mail'))
    .first();
  await email.waitFor({ state: 'visible', timeout: 90_000 });
  await email.fill(EMAIL);

  const password = page
    .locator('input[type="password"]')
    .or(page.getByLabel('Mot de passe'))
    .first();
  await password.fill(PASSWORD);

  await page.getByRole('button', { name: 'Connexion' }).or(page.getByText('Connexion', { exact: true })).last().click();

  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 90_000 });
  // Splash overlay ~1.1s + data fetch
  await page.waitForTimeout(3500);
  await dismissOverlays(page);
}

function readPngSize(filePath) {
  const buf = readFileSync(filePath);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

async function shot(page, name) {
  const path = resolve(OUT_DIR, name);
  await page.waitForTimeout(800);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  if (bodyText.includes('Pas encore de compte') && bodyText.includes('Connexion')) {
    throw new Error(`Screenshot ${name} still on login screen — demo session not restored`);
  }

  await page.screenshot({
    path,
    type: 'png',
    fullPage: false,
    animations: 'disabled',
  });

  const { w, h } = readPngSize(path);
  console.log(`Saved ${name} (${w}×${h})`);
  if (w !== 1284 || h !== 2778) {
    throw new Error(`Expected 1284×2778, got ${w}×${h} for ${name}`);
  }
  return path;
}

async function gotoPath(page, path) {
  await page.goto(`${WEB_URL}${path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(1500);
  await dismissOverlays(page);
}

async function run() {
  const meta = readMeta();
  let webProcess = null;

  try {
    if (START_WEB) {
      try {
        await waitForServer(WEB_URL, 5_000);
        console.log(`Reusing existing server at ${WEB_URL}`);
      } catch {
        webProcess = await startExpoWeb();
      }
    } else {
      await waitForServer(WEB_URL, 30_000);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
      isMobile: true,
      hasTouch: true,
      userAgent: devices['iPhone 14 Plus'].userAgent,
      locale: 'fr-FR',
      colorScheme: 'light',
    });
    const page = await context.newPage();

    await login(page);

    await gotoPath(page, '/');
    await shot(page, '01-dashboard.png');

    await gotoPath(page, '/clients');
    await shot(page, '02-clients.png');

    await gotoPath(page, '/invoices');
    await shot(page, '03-invoices.png');

    await gotoPath(page, '/quotes');
    await shot(page, '04-quotes.png');

    const invoicePath = meta.firstInvoiceId
      ? `/invoices/${meta.firstInvoiceId}`
      : '/invoices';
    await gotoPath(page, invoicePath);
    await shot(page, '05-invoice-detail.png');

    await gotoPath(page, '/settings');
    await shot(page, '06-settings.png');

    writeFileSync(
      resolve(OUT_DIR, 'manifest.json'),
      JSON.stringify(
        {
          size: '1284x2778',
          display: 'iphone-6.5',
          generatedAt: new Date().toISOString(),
          files: [
            '01-dashboard.png',
            '02-clients.png',
            '03-invoices.png',
            '04-quotes.png',
            '05-invoice-detail.png',
            '06-settings.png',
          ],
        },
        null,
        2,
      ),
    );

    await browser.close();
    console.log(`Done. Screenshots in ${OUT_DIR}`);
  } finally {
    if (webProcess) {
      webProcess.kill('SIGTERM');
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
