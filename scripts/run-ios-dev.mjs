import { spawn } from 'node:child_process';

process.env.APP_VARIANT = 'development';

const child = spawn('npx', ['expo', 'run:ios', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
