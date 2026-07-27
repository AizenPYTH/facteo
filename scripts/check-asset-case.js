/**
 * Fail if any require()/import path's basename differs in case from the file on disk.
 * Catches Windows→macOS EAS bundle breaks.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const imagesDir = path.join(root, 'assets', 'images');
const diskFiles = new Map(
  fs.readdirSync(imagesDir).map((f) => [f.toLowerCase(), f]),
);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'website' || entry.name.startsWith('.')) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const assetRef =
  /(?:require\(|from\s+)['"](@\/assets\/images\/[^'"]+\.(?:png|jpg|jpeg|gif|webp|svg)|(?:\.\.\/)+assets\/images\/[^'"]+\.(?:png|jpg|jpeg|gif|webp|svg))['"]/g;

let failed = false;
for (const file of walk(path.join(root, 'src'))) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = assetRef.exec(text))) {
    const ref = match[1];
    const base = path.basename(ref);
    const onDisk = diskFiles.get(base.toLowerCase());
    if (!onDisk) {
      console.error(`MISSING: ${ref} (from ${path.relative(root, file)})`);
      failed = true;
    } else if (onDisk !== base) {
      console.error(
        `CASE MISMATCH: ${ref} → disk has "${onDisk}" (from ${path.relative(root, file)})`,
      );
      failed = true;
    } else {
      console.log(`OK ${base} ← ${path.relative(root, file)}`);
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log('All asset references match disk case.');
