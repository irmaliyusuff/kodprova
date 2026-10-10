// Starts the counter locally: wrangler pages dev + a local D1 database.
//
// Use (from the repository root):
//   npm run counter:migrate   (first time and after every new migration)
//   npm run counter:dev       -> http://127.0.0.1:8788  (COUNTER_PORT to change)
//
// Serves the built site (dist/) when it exists, otherwise a placeholder page.
// Builds generated/questions.json first when it is missing: the counter takes
// its question ids from it. SUMMARY_KEY comes from .dev.vars in the repository
// root (template: .dev.vars.example). Writes only to the local database.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(import.meta.dirname, "..", "..");
export const WRANGLER = join(
  ROOT,
  "node_modules",
  "wrangler",
  "bin",
  "wrangler.js",
);
/** Must equal database_id in functions/wrangler.local.toml. */
export const LOCAL_DB_ID = "local-kodprova-sayac";
export const LOCAL_CONFIG = join("functions", "wrangler.local.toml");
export const DEFAULT_STATE = join(".wrangler", "state");
export const COMPATIBILITY_DATE = "2026-10-01";
/** Wrangler runs without prompts and sends no usage telemetry. */
export const WRANGLER_ENV = { CI: "1", WRANGLER_SEND_METRICS: "false" };
export const QUESTIONS_FILE = join(ROOT, "generated", "questions.json");

/** The folder to serve: the built site if there is one, else a placeholder. */
export function staticDir(): string {
  const dist = join(ROOT, "dist");
  if (existsSync(dist)) return dist;

  const placeholder = join(ROOT, ".wrangler", "counter-site");
  mkdirSync(placeholder, { recursive: true });
  writeFileSync(
    join(placeholder, "index.html"),
    '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n' +
      "    <title>Counter (local)</title>\n  </head>\n  <body>\n" +
      "    <p>The counter runs locally. The site is not built yet.</p>\n" +
      "  </body>\n</html>\n",
    "utf8",
  );
  return placeholder;
}

/** Builds generated/questions.json when it is missing. */
export function ensureQuestions(): void {
  if (existsSync(QUESTIONS_FILE)) return;
  const run = spawnSync(
    process.execPath,
    [join(ROOT, "scripts", "build-questions.ts")],
    { cwd: ROOT, stdio: "inherit" },
  );
  if (run.status !== 0) throw new Error("npm run build:questions failed.");
}

export function serverArgs(options: {
  port: number;
  persistTo?: string;
  extra?: string[];
}): string[] {
  return [
    WRANGLER,
    "pages",
    "dev",
    staticDir(),
    "--ip",
    "127.0.0.1",
    "--port",
    String(options.port),
    "--d1",
    `DB=${LOCAL_DB_ID}`,
    "--persist-to",
    options.persistTo ?? DEFAULT_STATE,
    "--compatibility-date",
    COMPATIBILITY_DATE,
    ...(options.extra ?? []),
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureQuestions();
  const port = Number(process.env.COUNTER_PORT ?? "8788");
  const server = spawn(process.execPath, serverArgs({ port }), {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...WRANGLER_ENV },
  });
  server.on("exit", (code) => process.exit(code ?? 0));
}
