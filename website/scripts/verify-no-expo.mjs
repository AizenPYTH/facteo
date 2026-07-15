import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'src');
const FORBIDDEN = [
  /expo-constants/,
  /from\s+['"]expo[\w-]*/,
  /from\s+['"]@expo\//,
  /from\s+['"]react-native['"]/,
  /from\s+['"]@react-native/,
  /EXPO_PUBLIC_/,
  /\b__DEV__\b/,
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];

for (const file of walk(ROOT)) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of FORBIDDEN) {
    if (pattern.test(content)) {
      violations.push(`${file.replace(/\\/g, '/')}: matches ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error('Expo/React Native references found in website/src:\n');
  for (const line of violations) {
    console.error(`  - ${line}`);
  }
  process.exit(1);
}

console.log('OK: website/src has no Expo/React Native references.');
