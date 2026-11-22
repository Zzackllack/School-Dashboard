import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = join(repoRoot, 'Frontend');
const frontendRequire = createRequire(join(frontendDir, 'package.json'));

function packageManifest(specifier) {
  return JSON.parse(readFileSync(frontendRequire.resolve(specifier), 'utf8'));
}

function frontendBin(name) {
  return join(frontendDir, 'node_modules', '.bin', name);
}

function binVersion(name) {
  return execFileSync(frontendBin(name), ['--version'], { encoding: 'utf8' }).trim();
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
  assert.match(api.version, /^6\./);

  assert.equal(native.name, 'typescript');
  assert.match(native.version, /^7\./);

  assert.match(binVersion('tsc'), /^Version 7\./);
  assert.match(binVersion('tsc6'), /^Version 6\./);
});

test('typescript-eslint resolves the TypeScript 6 API', () => {
  // Typescript-eslint reads ts.version from the package behind its `typescript`
  // peer, which is what @typescript/typescript6 re-exports.
  const ts = frontendRequire('typescript');
  assert.match(ts.version, /^6\./);

  const eslint = packageManifest('typescript-eslint/package.json');
  assert.ok(
    !eslint.peerDependencies.typescript.includes('7'),
    'typescript-eslint still rejects TypeScript 7; this test can go once that changes',
  );
});
