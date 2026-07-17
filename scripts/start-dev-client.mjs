import { spawn } from 'node:child_process';

/** Dev client custom (scheme facteo-dev) — seulement si FACTEO Dev est déjà installé. */
process.env.APP_VARIANT = 'development';

const child = spawn('npx', ['expo', 'start', '--dev-client', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
