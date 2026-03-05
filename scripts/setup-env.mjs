import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

export function toBooleanValue(input, fallback = false) {
  if (!input || input.trim().length === 0) {
    return fallback;
  }
  const normalized = input.trim().toLowerCase();
  return normalized === "y" || normalized === "yes" || normalized === "true";
}

export function ensureHttpUrl(value, fallback) {
  const candidate = (value ?? "").trim() || fallback;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export function formatEnv(entries) {
  const lines = [];
  for (const [key, value] of entries) {
    lines.push(`${key}=${value ?? ""}`);
  }
  return `${lines.join("\n")}\n`;
}

async function writeEnvFile(targetPath, entries) {
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, formatEnv(entries), "utf8");
}

async function askInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\nEnvironment bootstrap");
    console.log("This creates local .env files. Do not commit them.\n");

    const dsbUsername = (await rl.question("DSB username: ")).trim();
    const dsbPassword = (await rl.question("DSB password: ")).trim();
    const calendarIcsUrl = (
      await rl.question("Calendar ICS URL (optional): ")
    ).trim();

    const enableBootstrapAdmin = toBooleanValue(
      await rl.question("Enable dev bootstrap admin? (y/N): "),
      false,
    );

    const bootstrapUsername = enableBootstrapAdmin
      ? (
          await rl.question("Bootstrap admin username (default: dev-admin): ")
        ).trim() || "dev-admin"
      : "";
    const bootstrapPassword = enableBootstrapAdmin
      ? (await rl.question("Bootstrap admin password: ")).trim()
      : "";

    const backendUrl = ensureHttpUrl(
      await rl.question("Backend URL for frontend (default: http://localhost:8080): "),
      "http://localhost:8080",
    );

    const secureCookie = toBooleanValue(
      await rl.question("Use secure session cookies locally? (y/N): "),
      false,
    );

    const corsOriginsRaw =
      (
        await rl.question(
          "CORS origins comma-separated (default: http://localhost:3000,http://localhost:5173): ",
        )
      ).trim() || "http://localhost:3000,http://localhost:5173";

    return {
      dsbUsername,
      dsbPassword,
      calendarIcsUrl,
      enableBootstrapAdmin,
      bootstrapUsername,
      bootstrapPassword,
      backendUrl,
      secureCookie,
      corsOriginsRaw,
    };
  } finally {
    rl.close();
  }
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log(
      "Skipping interactive env setup (non-interactive terminal detected).",
    );
    return;
  }

  const answers = await askInteractive();

  const backendEnvPath = resolve(process.cwd(), "Backend/.env");
  const frontendEnvPath = resolve(process.cwd(), "Frontend/.env");

  await writeEnvFile(backendEnvPath, [
    ["DSB_USERNAME", answers.dsbUsername],
    ["DSB_PASSWORD", answers.dsbPassword],
    ["CALENDAR_ICS_URL", answers.calendarIcsUrl],
    ["SERVER_SERVLET_SESSION_COOKIE_SECURE", answers.secureCookie ? "true" : "false"],
    [
      "SECURITY_ADMIN_BOOTSTRAP_ENABLED",
      answers.enableBootstrapAdmin ? "true" : "false",
    ],
    ["SECURITY_ADMIN_BOOTSTRAP_USERNAME", answers.bootstrapUsername],
    ["SECURITY_ADMIN_BOOTSTRAP_PASSWORD", answers.bootstrapPassword],
    ["SECURITY_CORS_ALLOWED_ORIGINS", answers.corsOriginsRaw],
  ]);

  await writeEnvFile(frontendEnvPath, [
    ["BACKEND_URL", answers.backendUrl],
    ["VITE_BACKEND_URL", answers.backendUrl],
  ]);

  console.log(`\nWrote ${backendEnvPath}`);
  console.log(`Wrote ${frontendEnvPath}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
