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
    const normalizedValue = String(value ?? "");
    const escapedValue = normalizedValue
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
    lines.push(`${key}="${escapedValue}"`);
  }
  return `${lines.join("\n")}\n`;
}

async function writeEnvFile(targetPath, entries) {
  await mkdir(dirname(targetPath), { recursive: true, mode: 0o700 });
  await writeFile(targetPath, formatEnv(entries), { encoding: "utf8", mode: 0o600 });
}

async function askInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const defaultWriteToOutput = rl._writeToOutput.bind(rl);

  function withMaskedInput() {
    rl._writeToOutput = (str) => {
      if (str === "\n" || str === "\r" || str === "\r\n") {
        return rl.output.write(str);
      }
      const prompt = rl.getPrompt();
      if (prompt && str.startsWith(prompt)) {
        return rl.output.write(`${prompt}${"*".repeat(rl.line.length)}`);
      }
      return rl.output.write(str);
    };
  }

  function restoreOutput() {
    rl._writeToOutput = defaultWriteToOutput;
  }

  try {
    console.log("\nEnvironment bootstrap");
    console.log("This creates local .env files. Do not commit them.\n");

    const dsbUsername = (await rl.question("DSB username: ")).trim();
    let dsbPassword = "";
    withMaskedInput();
    try {
      dsbPassword = (await rl.question("DSB password: ")).trim();
    } finally {
      restoreOutput();
    }
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
    let resolvedBootstrapPassword = "";
    if (enableBootstrapAdmin) {
      withMaskedInput();
      try {
        resolvedBootstrapPassword = (
          await rl.question("Bootstrap admin password: ")
        ).trim();
      } finally {
        restoreOutput();
      }
    }

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
      bootstrapPassword: resolvedBootstrapPassword,
      backendUrl,
      secureCookie,
      corsOriginsRaw,
    };
  } finally {
    rl._writeToOutput = defaultWriteToOutput;
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
  const backendDataDbPath = resolve(
    process.cwd(),
    "Backend/data/substitution-plans",
  );
  const datasourceUrl = `jdbc:h2:file:${backendDataDbPath};DB_CLOSE_DELAY=-1`;

  await writeEnvFile(backendEnvPath, [
    ["SPRING_DATASOURCE_URL", datasourceUrl],
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
