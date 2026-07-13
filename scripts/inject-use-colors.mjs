import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : fullPath.endsWith('.tsx') ? [fullPath] : [];
  });
}

let changed = 0;

for (const filePath of walk('src')) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('useThemedStyles')) {
    continue;
  }

  if (content.includes('const colors = useColors()')) {
    continue;
  }

  if (!content.match(/\bcolors\./)) {
    continue;
  }

  if (content.includes("import { useThemedStyles } from '@/hooks/use-colors';")) {
    content = content.replace(
      "import { useThemedStyles } from '@/hooks/use-colors';",
      "import { useColors, useThemedStyles } from '@/hooks/use-colors';",
    );
  }

  const replaced = content.replace(
    /(export (?:default )?function [A-Za-z0-9_]+\([^)]*\) \{\n)(  const styles = useStyles\(\);\n)/,
    '$1$2  const colors = useColors();\n',
  );

  if (replaced !== content) {
    fs.writeFileSync(filePath, replaced, 'utf8');
    changed += 1;
    console.log('updated', filePath);
  }
}

console.log(`Done. Updated ${changed} files.`);
