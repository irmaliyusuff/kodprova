// End-to-end tests for the counter: real HTTP against the local Cloudflare
// runtime (wrangler pages dev) and a local D1 database.
//
// LOCAL ONLY: the test starts its own server on 127.0.0.1 and never calls a
// live address. Each run creates an empty database in .wrangler/counter-e2e-*,
// applies the migration, and removes the folder when done.
//
// Run (from the repository root): npm run counter:e2e
// Port: COUNTER_E2E_PORT (default 8799).
// Windows path limit: wrangler fails with "internal error" when the local D1
// file path passes 260 characters. From a long folder (e.g. a clean clone in a
// temp folder) give a short state folder: COUNTER_E2E_STATE=C:\short\path
import assert from "node:assert/strict";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { after, before, test } from "node:test";
import {
  ensureQuestions,
  LOCAL_CONFIG,
  QUESTIONS_FILE,
  ROOT,
  serverArgs,
  WRANGLER,
  WRANGLER_ENV,
} from "../functions/_local/server.ts";

const PORT = Number(process.env.COUNTER_E2E_PORT ?? "8799");
const BASE = `http://127.0.0.1:${PORT}`;
const RUN = Date.now().toString(36);
const STATE =
  process.env.COUNTER_E2E_STATE === undefined
    ? join(ROOT, ".wrangler", `counter-e2e-${RUN}`)
    : join(process.env.COUNTER_E2E_STATE, RUN.slice(-4));
// Lives only in this test run; never written to a file or the output.
const KEY = randomBytes(24).toString("base64url");
const MARKER = "MARKER-7f3a";

let server: ChildProcess | undefined;
let questions: { id: string; bugs: unknown[] }[] = [];

function wrangler(...args: string[]): string {
  return execFileSync(process.execPath, [WRANGLER, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...WRANGLER_ENV },
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const LOCAL_DB = ["--local", "--config", LOCAL_CONFIG, "--persist-to", STATE];

function query(sql: string): Record<string, unknown>[] {
  const out = wrangler(
    "d1",
    "execute",
    "kodprova-sayac",
    ...LOCAL_DB,
    "--json",
    "--command",
    sql,
  );
  return (JSON.parse(out) as { results: Record<string, unknown>[] }[])[0]!
    .results;
}

async function call(path: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, init);
  } catch (error) {
    // The local server may reset an idle socket; retry once.
    const code = (error as { cause?: { code?: string } }).cause?.code;
    if (code !== "ECONNRESET") throw error;
    response = await fetch(`${BASE}${path}`, init);
  }
  const text = await response.text();
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON: look at text
  }
  return { status: response.status, headers: response.headers, text, body };
}

function submit(body: unknown, headers: Record<string, string> = {}) {
  return call("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function summary(key?: string, path = "/api/summary") {
  const headers: Record<string, string> =
    key === undefined ? {} : { Authorization: `Bearer ${key}` };
  return call(path, { headers });
}

function stopServer(): void {
  if (server?.pid === undefined) return;
  if (process.platform === "win32") {
    // wrangler starts child processes (workerd): close the whole tree.
    try {
      execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    } catch {
      // already closed
    }
  } else {
    server.kill("SIGTERM");
  }
}

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      await fetch(`${BASE}/`, { signal: AbortSignal.timeout(1000) });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("The local server was not ready within 60 seconds.");
}

before(async () => {
  ensureQuestions();
  questions = (
    JSON.parse(readFileSync(QUESTIONS_FILE, "utf8")) as {
      questions: typeof questions;
    }
  ).questions;

  // The migration runs on an EMPTY database.
  const out = wrangler(
    "d1",
    "migrations",
    "apply",
    "kodprova-sayac",
    ...LOCAL_DB,
  );
  assert.match(out, /0001_submission_counts\.sql/);

  server = spawn(
    process.execPath,
    serverArgs({
      port: PORT,
      persistTo: STATE,
      extra: ["--binding", `SUMMARY_KEY=${KEY}`],
    }),
    {
      cwd: ROOT,
      env: { ...process.env, ...WRANGLER_ENV },
      stdio: "ignore",
    },
  );
  await waitForServer();
});

after(async () => {
  stopServer();
  // workerd holds the database files for a moment after it is closed.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  try {
    rmSync(STATE, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 500,
    });
  } catch {
    // Still held: the folder stays under .wrangler/ (ignored by git).
    console.log(`Could not remove ${STATE}; delete it by hand.`);
  }
});

test("a valid submission: 204, no body, no cookie", async () => {
  const question = questions[0]!;
  const response = await submit(
    {
      questionId: question.id,
      lang: "tr",
      found: 0,
      total: question.bugs.length,
      falseAlarms: 1,
      reasonGiven: false,
      testCorrect: true,
    },
    {
      "User-Agent": `Agent ${MARKER}`,
      Referer: `https://example.test/${MARKER}`,
      Cookie: `id=${MARKER}`,
      "Accept-Language": `tr-${MARKER}`,
      "X-Forwarded-For": "203.0.113.7",
    },
  );
  assert.equal(response.status, 204);
  assert.equal(response.text, "");
  assert.equal(response.headers.get("Set-Cookie"), null);
});

test("every real question is accepted with its bug count", async () => {
  for (const [index, question] of questions.entries()) {
    const response = await submit({
      questionId: question.id,
      lang: index % 2 === 0 ? "en" : "tr",
      found: question.bugs.length,
      total: question.bugs.length,
      falseAlarms: 0,
      reasonGiven: true,
      testCorrect: index % 3 === 0,
    });
    assert.equal(response.status, 204, question.id);
  }
});

test("invalid bodies: 400", async () => {
  const question = questions[0]!;
  const good = {
    questionId: question.id,
    lang: "en",
    found: 0,
    total: question.bugs.length,
    falseAlarms: 1,
    reasonGiven: false,
    testCorrect: false,
  };
  for (const [body, code] of [
    ["{", "INVALID_REQUEST"],
    [{ ...good, questionId: "no-such-question" }, "INVALID_INPUT"],
    [{ ...good, total: 3 }, "INVALID_INPUT"],
    [{ ...good, lang: "de" }, "INVALID_INPUT"],
    [{ ...good, reason: "text" }, "INVALID_INPUT"],
  ] as const) {
    const response = await submit(body);
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.equal(
      (response.body as { error: { code: string } }).error.code,
      code,
    );
  }
});

test("wrong method 405, not JSON 415, too large 413", async () => {
  assert.equal((await call("/api/submissions")).status, 405);
  const text = await call("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  });
  assert.equal(text.status, 415);
  assert.equal((await submit({ pad: "x".repeat(2000) })).status, 413);
});

test("summary: 401 without a key, 403 with a wrong key", async () => {
  const none = await summary();
  assert.equal(none.status, 401);
  assert.match(none.headers.get("WWW-Authenticate") ?? "", /^Bearer/);
  assert.equal((await summary(`${KEY}x`)).status, 403);
  assert.equal(
    (await summary(undefined, `/api/summary?key=${KEY}`)).status,
    401,
  );
});

test("summary with the key: the counts so far", async () => {
  const response = await summary(KEY);
  assert.equal(response.status, 200);
  const body = response.body as {
    totals: { submissions: number; tr: number; en: number };
    byQuestion: { questionId: string; submissions: number }[];
  };
  assert.equal(body.totals.submissions, 1 + questions.length);
  assert.equal(body.byQuestion.length, questions.length);
  assert.equal(body.byQuestion[0]?.submissions, 2);
  assert.equal(body.totals.tr + body.totals.en, body.totals.submissions);
});

test("the database holds only counts: no header value, no time of day", () => {
  const columns = query("PRAGMA table_info(submission_counts)").map(
    (column) => column.name,
  );
  assert.deepEqual(columns, [
    "day",
    "question_id",
    "lang",
    "found",
    "total",
    "false_alarms",
    "reason_given",
    "test_correct",
    "submissions",
  ]);
  const rows = query("SELECT * FROM submission_counts");
  const dump = JSON.stringify(rows);
  assert.ok(!dump.includes(MARKER));
  assert.ok(!dump.includes("203.0.113.7"));
  assert.ok(
    rows.every((row) => /^\d{4}-\d{2}-\d{2}$/.test(String(row.day))),
    "day only",
  );
  const tables = query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_cf%' ESCAPE '\\' AND name NOT LIKE 'sqlite%' ORDER BY name",
  ).map((row) => row.name);
  assert.deepEqual(tables, ["d1_migrations", "submission_counts"]);
});
