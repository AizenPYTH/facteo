import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const publicDir = join(process.cwd(), 'public');
const distDir = join(process.cwd(), 'dist');

if (!existsSync(publicDir)) {
  process.exit(0);
}

if (!existsSync(distDir)) {
  console.error('dist/ introuvable — lancez build:web avant.');
  process.exit(1);
}

for (const file of readdirSync(publicDir)) {
  copyFileSync(join(publicDir, file), join(distDir, file));
  console.log(`Copied public/${file} → dist/${file}`);
}
