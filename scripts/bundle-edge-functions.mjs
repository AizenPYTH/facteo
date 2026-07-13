import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'supabase', 'functions');
const outDir = path.join(__dirname, 'bundles');

fs.mkdirSync(outDir, { recursive: true });

const shared = fs.readFileSync(path.join(root, '_shared', 'subscription-sync.ts'), 'utf8');

const functions = [
  { name: 'stripe-create-subscription-checkout', shared: true, verifyJwt: true },
  { name: 'stripe-confirm-subscription-checkout', shared: true, verifyJwt: true },
  { name: 'stripe-subscription-webhook', shared: true, verifyJwt: false },
  { name: 'stripe-create-checkout', shared: false, verifyJwt: true },
  { name: 'stripe-webhook', shared: false, verifyJwt: false },
];

for (const fn of functions) {
  let index = fs.readFileSync(path.join(root, fn.name, 'index.ts'), 'utf8');
  const files = [{ name: 'index.ts', content: index }];

  if (fn.shared) {
    files[0].content = index.replace(
      "from '../_shared/subscription-sync.ts'",
      "from './_shared/subscription-sync.ts'",
    );
    files.push({ name: '_shared/subscription-sync.ts', content: shared });
  }

  fs.writeFileSync(
    path.join(outDir, `${fn.name}.json`),
    JSON.stringify({ name: fn.name, verify_jwt: fn.verifyJwt, files }),
  );

  console.log(`Bundled ${fn.name} (${files.length} files)`);
}
