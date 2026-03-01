import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const MAVEN_INSTALL_URL = 'https://maven.apache.org/install.html';

export function resolveMavenInvocation(goals, options = {}) {
  const baseDir = options.baseDir ?? process.cwd();
  const platform = options.platform ?? process.platform;
  const backendDir = resolve(baseDir, 'Backend');

  const wrapperFile = platform === 'win32' ? 'mvnw.cmd' : 'mvnw';
  const wrapperPath = resolve(backendDir, wrapperFile);

  if (existsSync(wrapperPath)) {
    if (platform === 'win32') {
      return {
        command: 'cmd.exe',
        args: ['/d', '/s', '/c', 'mvnw.cmd', ...goals],
        cwd: backendDir,
        usesWrapper: true,
      };
    }

    return {
      command: './mvnw',
      args: goals,
      cwd: backendDir,
      usesWrapper: true,
    };
  }

  return {
    command: 'mvn',
    args: ['-f', resolve(backendDir, 'pom.xml'), ...goals],
    cwd: baseDir,
    usesWrapper: false,
  };
}

function printMavenMissingHelp() {
  console.error('\nMaven executable was not found.');
  console.error('Install Maven, then run `pnpm run setup:maven-wrapper` once to create the local wrapper.');
  console.error(`Install guide: ${MAVEN_INSTALL_URL}\n`);
}

export function runMaven(goals, options = {}) {
  const invocation = resolveMavenInvocation(goals, options);

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        printMavenMissingHelp();
        resolvePromise(127);
        return;
      }

      rejectPromise(error);
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        resolvePromise(1);
        return;
      }

      resolvePromise(code ?? 1);
    });
  });
}

async function main() {
  const goals = process.argv.slice(2);

  if (goals.length === 0) {
    console.error('Usage: node ./scripts/maven-runner.mjs <maven-goal> [additional-args]');
    process.exit(1);
  }

  const commandPreview = goals.join(' ');
  console.log(`Running backend command: ${commandPreview}`);

  const code = await runMaven(goals);
  process.exit(code);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
