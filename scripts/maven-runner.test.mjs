import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { resolveMavenInvocation } from './maven-runner.mjs';

function createBaseDir() {
  const baseDir = mkdtempSync(join(tmpdir(), 'school-dashboard-'));
  mkdirSync(join(baseDir, 'Backend'), { recursive: true });
  writeFileSync(join(baseDir, 'Backend', 'pom.xml'), '<project/>', 'utf8');
  return baseDir;
}

test('uses Maven Wrapper on Linux/macOS when Backend/mvnw exists', () => {
  const baseDir = createBaseDir();
  writeFileSync(join(baseDir, 'Backend', 'mvnw'), '#!/bin/sh\n', 'utf8');

  const result = resolveMavenInvocation(['spring-boot:run'], {
    baseDir,
    platform: 'linux',
  });

  assert.equal(result.command, './mvnw');
  assert.deepEqual(result.args, ['spring-boot:run']);
  assert.equal(result.cwd, resolve(baseDir, 'Backend'));
  assert.equal(result.usesWrapper, true);
});

test('uses Maven Wrapper on Windows when Backend/mvnw.cmd exists', () => {
  const baseDir = createBaseDir();
  writeFileSync(join(baseDir, 'Backend', 'mvnw.cmd'), '@echo off\r\n', 'utf8');

  const result = resolveMavenInvocation(['test'], {
    baseDir,
    platform: 'win32',
  });

  assert.equal(result.command, 'cmd.exe');
  assert.deepEqual(result.args, ['/d', '/s', '/c', 'mvnw.cmd', 'test']);
  assert.equal(result.cwd, resolve(baseDir, 'Backend'));
  assert.equal(result.usesWrapper, true);
});

test('falls back to system Maven when wrapper is missing', () => {
  const baseDir = createBaseDir();

  const result = resolveMavenInvocation(['-DskipTests', 'package'], {
    baseDir,
    platform: 'linux',
  });

  assert.equal(result.command, 'mvn');
  assert.deepEqual(result.args, ['-f', resolve(baseDir, 'Backend', 'pom.xml'), '-DskipTests', 'package']);
  assert.equal(result.cwd, baseDir);
  assert.equal(result.usesWrapper, false);
});
