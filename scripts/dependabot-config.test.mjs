import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dependabotConfig = parse(readFileSync(join(repoRoot, '.github/dependabot.yml'), 'utf8'));

function jobFor(ecosystem) {
  const job = dependabotConfig.updates.find((update) => update['package-ecosystem'] === ecosystem);
  assert.ok(job, `expected a "${ecosystem}" entry in .github/dependabot.yml`);
  return job;
}

// Dependabot keys its job off `directory`, and it can only update a lockfile it
// fetched from that directory (or a parent of it). This repo is a pnpm workspace
// whose pnpm-lock.yaml and pnpm-workspace.yaml both sit in the repository root,
// while every real dependency lives in Frontend/. Pointing the npm job at
// /Frontend made Dependabot fetch both pnpm files from the parent directory and
// then silently skip the lockfile updater, so every frontend dependency PR
// arrived touching Frontend/package.json only and could not pass
// `pnpm install --frozen-lockfile`.
//
// Dependabot treats that layout as unsupported in the other direction too: it
// refuses to update a workspace from inside a subdirectory, but only raises the
// error when a PR would have been lockfile-only. A package.json edit next to it
// hides the misconfiguration, which is why this went unnoticed.
//
// See dependabot-core file_updater.rb, raise_miss_configured_tooling_if_pnpm_subdirectory.
test('npm job runs at the workspace root so Dependabot owns the shared lockfile', () => {
  assert.equal(jobFor('npm').directory, '/');
});

test('the npm job directory actually contains the pnpm workspace files', () => {
  const { directory } = jobFor('npm');
  const jobDir = join(repoRoot, directory);

  for (const file of ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'package.json']) {
    assert.ok(
      existsSync(join(jobDir, file)),
      `Dependabot's npm job directory ${directory} must contain ${file}, ` +
        'otherwise it cannot update the lockfile',
    );
  }
});

test('pnpm-workspace.yaml lists every package that holds a package.json', () => {
  // If a second workspace package is added without being registered here,
  // Dependabot keeps ignoring its dependencies.
  const workspace = parse(readFileSync(join(repoRoot, 'pnpm-workspace.yaml'), 'utf8'));
  assert.deepEqual(workspace.packages, ['Frontend']);
});

test('no npm job is declared for a workspace subdirectory', () => {
  // Two npm jobs would let Dependabot open a second, subdirectory-scoped set of
  // PRs that reintroduce the stale-lockfile problem.
  const npmJobs = dependabotConfig.updates.filter((update) => update['package-ecosystem'] === 'npm');
  assert.equal(npmJobs.length, 1);
});

test('maven and github-actions jobs keep their own directories', () => {
  // The Backend pom.xml is self-contained, and GitHub Actions must be scanned
  // from the root, so neither should follow the npm job to "/".
  assert.equal(jobFor('maven').directory, '/Backend');
  assert.equal(jobFor('github-actions').directory, '/');
});

test('every update job has the keys Dependabot requires', () => {
  for (const job of dependabotConfig.updates) {
    const ecosystem = job['package-ecosystem'];
    assert.ok(job.directory || job.directories, `${ecosystem} needs directory or directories`);
    assert.ok(job.schedule?.interval, `${ecosystem} needs schedule.interval`);
  }
});
