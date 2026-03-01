import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { runMaven } from './maven-runner.mjs';

const rootDir = process.cwd();
const backendDir = resolve(rootDir, 'Backend');
const wrapperShell = resolve(backendDir, 'mvnw');
const wrapperCmd = resolve(backendDir, 'mvnw.cmd');

async function main() {
  console.log('Checking Maven Wrapper setup...');

  if (existsSync(wrapperShell) || existsSync(wrapperCmd)) {
    console.log('Maven Wrapper is already present in ./Backend.');
    return;
  }

  console.log('Maven Wrapper not found. Generating wrapper files in ./Backend...');
  const code = await runMaven(['-N', 'wrapper:wrapper']);

  if (code !== 0) {
    process.exit(code);
  }

  console.log('Maven Wrapper generated successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
