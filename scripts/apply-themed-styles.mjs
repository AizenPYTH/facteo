/**
 * Converts components using static `colors` imports to themed styles.
 * Run: node scripts/apply-themed-styles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function shouldSkip(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.includes('/providers/colors-provider.tsx') ||
    normalized.includes('/constants/theme/colors.ts')
  );
}

function transformFile(filePath, content) {
  if (!content.includes("from '@/constants/theme/colors'")) {
    return null;
  }

  if (shouldSkip(filePath)) {
    return null;
  }

  let next = content;

  if (next.includes('useThemedStyles')) {
    return null;
  }

  next = next.replace(
    /import\s*\{([^}]*)\}\s*from\s*'@\/constants\/theme\/colors';/g,
    (match, imports) => {
      const names = imports
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

      if (names.length === 1 && names[0] === 'colors') {
        return "import { useThemedStyles } from '@/hooks/use-colors';";
      }

      const withoutColors = names.filter((name) => name !== 'colors');

      if (withoutColors.length === 0) {
        return "import { useThemedStyles } from '@/hooks/use-colors';";
      }

      return `import { useThemedStyles } from '@/hooks/use-colors';\nimport { ${withoutColors.join(', ')} } from '@/constants/theme/colors';`;
    },
  );

  const styleSheetMatch = next.match(/const styles = StyleSheet\.create\(\{[\s\S]*?\}\);/);

  if (!styleSheetMatch || !styleSheetMatch[0].includes('colors.')) {
    return null;
  }

  const styleBody = styleSheetMatch[0]
    .replace('const styles = StyleSheet.create({', '')
    .replace(/\}\);$/, '');

  next = next.replace(styleSheetMatch[0], `function useStyles() {
  return useThemedStyles((colors) => (${styleBody}));
}`);

  const componentPatterns = [
    /export function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/g,
    /export default function ([A-Za-z0-9_]+)\([^)]*\)\s*\{/g,
  ];

  let transformed = false;

  for (const pattern of componentPatterns) {
    next = next.replace(pattern, (match, name) => {
      const after = next.slice(next.indexOf(match) + match.length, next.indexOf(match) + match.length + 400);

      if (after.includes('const styles = useStyles()')) {
        return match;
      }

      transformed = true;
      return `${match}\n  const styles = useStyles();`;
    });
  }

  if (!transformed) {
    return null;
  }

  return next;
}

const files = walk(SRC_DIR);
let changed = 0;

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const transformed = transformFile(filePath, content);

  if (transformed) {
    fs.writeFileSync(filePath, transformed, 'utf8');
    changed += 1;
    console.log('updated', path.relative(process.cwd(), filePath));
  }
}

console.log(`Done. Updated ${changed} files.`);
