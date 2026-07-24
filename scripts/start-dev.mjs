import { spawn } from 'node:child_process';

/**
 * Démarre Metro en mode Expo Go (exp://).
 * Le QR utilise exp:// (Expo Go), pas le scheme inveq://.
 */
const child = spawn('npx', ['expo', 'start', '--go', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
