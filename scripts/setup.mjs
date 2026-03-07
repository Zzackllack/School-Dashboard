import { spawn } from 'node:child_process';
import process from 'node:process';

function resolvePnpmCommand() {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function run(command, args, label) {
  console.log(label);

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        console.error('\npnpm is not installed or not available in PATH.');
        console.error('Install pnpm: https://pnpm.io/installation\n');
        resolvePromise(127);
        return;
      }

      rejectPromise(error);
    });

    child.on('exit', (code) => {
      resolvePromise(code ?? 1);
    });
  });
}

async function main() {
  console.log('Setting up School-Dashboard monorepo...');

  const installCode = await run(
    resolvePnpmCommand(),
    ['install', '--frozen-lockfile'],
    'Installing JavaScript dependencies with pnpm...'
  );

  if (installCode !== 0) {
    process.exit(installCode);
  }

  const wrapperCode = await run(
    process.execPath,
    ['./scripts/setup-maven-wrapper.mjs'],
    'Ensuring Maven Wrapper exists in Backend/...'
  );

  if (wrapperCode !== 0) {
    process.exit(wrapperCode);
  }

  const envCode = await run(
    process.execPath,
    ['./scripts/setup-env.mjs'],
    'Collecting local credentials and writing .env files...'
  );

  if (envCode !== 0) {
    process.exit(envCode);
  }

  console.log('Setup completed. You can now run `pnpm run dev`.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
