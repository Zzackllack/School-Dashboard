import { spawnSync } from "node:child_process";
import process from "node:process";

const REQUIRED_PNPM_VERSION = "10.12.4";
const lifecycle = process.env.npm_lifecycle_event ?? "this command";
const suggestedCommand = lifecycle.startsWith("pre") ? lifecycle.slice(3) : lifecycle.startsWith("post") ? lifecycle.slice(4) : lifecycle;
const userAgent = process.env.npm_config_user_agent ?? "";
const execPath = process.env.npm_execpath ?? "";

function isPnpmRuntime() {
  return userAgent.startsWith("pnpm/") || execPath.includes("pnpm");
}

function isNpmRuntime() {
  return userAgent.startsWith("npm/") || execPath.includes("npm-cli");
}

function hasCommand(command, args = ["--version"]) {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return result.status === 0;
}

function tryBootstrapPnpm() {
  if (!hasCommand("corepack", ["--version"])) {
    return false;
  }

  const enable = spawnSync("corepack", ["enable"], { stdio: "inherit" });
  if (enable.status !== 0) {
    return false;
  }

  const prepare = spawnSync(
    "corepack",
    ["prepare", `pnpm@${REQUIRED_PNPM_VERSION}`, "--activate"],
    { stdio: "inherit" },
  );
  return prepare.status === 0;
}

if (isPnpmRuntime()) {
  process.exit(0);
}

if (!isNpmRuntime()) {
  process.exit(0);
}

console.error(
  `This project requires pnpm. You ran "${lifecycle}" via npm, which is not supported.`,
);

if (!hasCommand("pnpm")) {
  console.error("pnpm is not available in PATH. Trying Corepack bootstrap...");
  const bootstrapped = tryBootstrapPnpm();
  if (!bootstrapped) {
    console.error("Install pnpm: https://pnpm.io/installation");
    process.exit(1);
  }
}

console.error(
  `Run this command with pnpm instead, for example: pnpm run ${suggestedCommand}`,
);
process.exit(1);
