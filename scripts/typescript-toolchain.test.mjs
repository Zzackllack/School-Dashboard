import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = join(repoRoot, 'Frontend');
const frontendRequire = createRequire(join(frontendDir, 'package.json'));

function packageManifest(specifier) {
  return JSON.parse(readFileSync(frontendRequire.resolve(specifier), 'utf8'));
}

function binVersion(name) {
  const binDir = join(frontendDir, 'node_modules', '.bin');
  const shim = process.platform === 'win32' ? name + '.cmd' : name;
  assert.ok(existsSync(join(binDir, shim)), 'Missing frontend binary: ' + shim);

  return execSync(name + ' --version', {
    cwd: frontendDir,
    encoding: 'utf8',
    env: { ...process.env, PATH: [binDir, process.env.PATH].join(delimiter) },
  }).trim();
}

// TypeScript 7 ships only the native tsc and no compiler API. typescript-eslint
// still needs the TypeScript 6 JS API, so the two are installed side by side:
// `tsc` comes from @typescript/native (TS 7) and `typescript` resolves to
// @typescript/typescript6 (TS 6) for every API consumer such as lint, Vite
// plugins, and Vitest.
//
// This pins that split. Without it a well-meaning `typescript` bump silently
// moves lint back to TS 7, where typescript-eslint hard-fails at startup.
// Remove this test once typescript-eslint supports TypeScript >= 7.
test('tsc runs TypeScript 7 while the compiler API resolves to TypeScript 6', () => {
  const api = packageManifest('typescript/package.json');
  const native = packageManifest('@typescript/native/package.json');

  assert.equal(api.name, '@typescript/typescript6');
  assert.match(api.version, /^6\.0\./);

  assert.equal(native.name, 'typescript');
  assert.match(native.version, /^7\./);

  assert.match(binVersion('tsc'), /^Version 7\./);
  assert.match(binVersion('tsc6'), /^Version 6\.0\./);
});

test('typescript-eslint resolves the TypeScript 6.0 compiler API', () => {
  const eslintRequire = createRequire(frontendRequire.resolve('typescript-eslint'));
  const ts = eslintRequire('typescript');

  assert.match(ts.version, /^6\.0\./);
});
