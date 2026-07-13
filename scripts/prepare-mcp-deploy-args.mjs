import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlesDir = path.join(__dirname, 'bundles');
const outDir = path.join(__dirname, 'mcp-args');

fs.mkdirSync(outDir, { recursive: true });

const projectId = 'eogyopufctnqasjhsthp';

for (const file of fs.readdirSync(bundlesDir).filter((name) => name.endsWith('.json'))) {
  const bundle = JSON.parse(fs.readFileSync(path.join(bundlesDir, file), 'utf8'));
  const args = {
    project_id: projectId,
    name: bundle.name,
    verify_jwt: bundle.verify_jwt,
    entrypoint_path: 'index.ts',
    files: bundle.files,
  };

  fs.writeFileSync(path.join(outDir, file), JSON.stringify(args));
  console.log(`Prepared MCP args for ${bundle.name}`);
}
