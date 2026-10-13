// Unit tests for the anonymous counter (functions/, G8). No server, no
// network: handlers run against an in-memory SQLite database with the real
// migration. The local Cloudflare runtime is tested by `npm run counter:e2e`.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import type * as SubmissionsRoute from "../functions/api/submissions.ts";
import type * as SummaryRoute from "../functions/api/summary.ts";
import { catalogFrom, type Catalog } from "../functions/_lib/catalog.ts";
import {
  submissionsHandler,
  summaryHandler,
  type Options,
} from "../functions/_lib/handlers.ts";
import { KEY_MIN_LENGTH } from "../functions/_lib/key.ts";
import { rateLimiter } from "../functions/_lib/rate.ts";
import { BODY_LIMIT_BYTES } from "../functions/_lib/request.ts";
import {
  deleteBefore,
  recordSubmission,
  RETENTION_MONTHS,
  retentionCutoff,
  utcDay,
} from "../functions/_lib/store.ts";
import {
  validateSubmission,
  type Submission,
} from "../functions/_lib/submission.ts";
import type { Env, Handler } from "../functions/_lib/types.ts";
import { loadQuestions } from "../scripts/lib/load.ts";
import { publishQuestions } from "../scripts/lib/publish.ts";
import {
  failingD1,
  memoryD1,
  MIGRATION,
  untouchableD1,
  type MemoryD1,
} from "./counter-d1.ts";
import { REAL_QUESTIONS, REPO_ROOT } from "./helpers.ts";

// The route files load generated/questions.json, which a clean clone does not
// have before `npm run build:questions`; so they are imported for their types
// only. This still makes `npm run typecheck` check them.
const routes: Handler[] = [] as (
  typeof SubmissionsRoute.onRequest | typeof SummaryRoute.onRequest
)[];
void routes;

const CATALOG: Catalog = new Map([
  ["q-one", 1],
  ["q-two", 2],
]);
const KEY = "k".repeat(KEY_MIN_LENGTH);
/** 2026-10-11 23:59:59 UTC: already the 12th in Istanbul. */
const NOW = Date.UTC(2026, 9, 11, 23, 59, 59);
const BASE = "http://127.0.0.1:8788";

function valid(overrides: Record<string, unknown> = {}) {
  return {
    questionId: "q-two",
    lang: "tr",
    found: 1,
    total: 2,
    falseAlarms: 1,
    reasonGiven: true,
    testCorrect: false,
    ...overrides,
  };
}

function post(
  body: unknown,
  headers: Record<string, string> = { "Content-Type": "application/json" },
): Request {
  return new Request(`${BASE}/api/submissions`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function summaryRequest(
  query = "",
  headers: Record<string, string> = { Authorization: `Bearer ${KEY}` },
  method = "GET",
): Request {
  return new Request(`${BASE}/api/summary${query}`, { method, headers });
}

/** One stored row per day (q-one, tr), for the retention tests. */
function seedDays(store: MemoryD1, days: string[]): void {
  for (const day of days) {
    store.exec(
      `INSERT INTO submission_counts VALUES ('${day}', 'q-one', 'tr', 1, 1, 0, 0, 0, 3)`,
    );
  }
}

function storedDays(store: MemoryD1): string[] {
  return [...new Set(store.dump().map((row) => String(row.day)))];
}

async function errorOf(response: Response) {
  const body = (await response.json()) as {
    ok: boolean;
    error: { code: string; fields?: Record<string, string> };
  };
  assert.equal(body.ok, false);
  return body.error;
}

/** Captures console.error lines while a test runs. */
function captureErrors(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  return { lines, restore: () => (console.error = original) };
}

function handlers(options: Partial<Options> = {}) {
  const all: Options = {
    catalog: CATALOG,
    now: () => NOW,
    limiter: rateLimiter(1000),
    ...options,
  };
  return { submit: submissionsHandler(all), summary: summaryHandler(all) };
}

describe("counter: question catalog", () => {
  test("has every real question with its bug count", async () => {
    const { questions, errors } = await loadQuestions(REAL_QUESTIONS);
    assert.deepEqual(errors, []);
    const published = publishQuestions(questions);
    const catalog = catalogFrom(published);

    assert.equal(catalog.size, published.questions.length);
    for (const question of published.questions) {
      assert.equal(catalog.get(question.id), question.bugs.length);
      const result = validateSubmission(
        valid({
          questionId: question.id,
          total: question.bugs.length,
          found: 0,
        }),
        catalog,
      );
      assert.equal(result.ok, true, question.id);
    }
  });

  for (const [name, data] of [
    ["no data", null],
    ["no questions", { questions: [] }],
    ["a missing id", { questions: [{ bugs: [{}] }] }],
    ["an invalid id", { questions: [{ id: "Not An Id", bugs: [{}] }] }],
    [
      "a repeated id",
      {
        questions: [
          { id: "a", bugs: [{}] },
          { id: "a", bugs: [{}] },
        ],
      },
    ],
    ["no bugs", { questions: [{ id: "a", bugs: [] }] }],
    ["three bugs", { questions: [{ id: "a", bugs: [{}, {}, {}] }] }],
  ] as const) {
    test(`refuses question data with ${name}`, () => {
      assert.throws(() => catalogFrom(data));
    });
  }
});

describe("counter: submission fields", () => {
  test("accepts a valid submission and keeps exactly the contract fields", () => {
    const result = validateSubmission(valid(), CATALOG);
    assert.deepEqual(result, { ok: true, submission: valid() });
  });

  test("accepts the bounds", () => {
    for (const body of [
      valid({ questionId: "q-one", total: 1, found: 1, falseAlarms: 0 }),
      valid({ questionId: "q-one", total: 1, found: 0, falseAlarms: 5 }),
      valid({ found: 2, falseAlarms: 3 }),
      valid({ found: 0, falseAlarms: 1, reasonGiven: true }),
      valid({ lang: "en", reasonGiven: false, testCorrect: true }),
    ]) {
      assert.equal(validateSubmission(body, CATALOG).ok, true);
    }
  });

  const cases: [string, Record<string, unknown>, Record<string, string>][] = [
    [
      "unknown question",
      { questionId: "q-three" },
      { questionId: "unknown_question" },
    ],
    ["question id not a string", { questionId: 1 }, { questionId: "type" }],
    ["other language", { lang: "de" }, { lang: "range" }],
    ["language not a string", { lang: null }, { lang: "type" }],
    [
      "total is not the bug count",
      { total: 1, found: 1 },
      { total: "mismatch" },
    ],
    [
      "found above total",
      { questionId: "q-one", total: 1, found: 2, falseAlarms: 0 },
      { found: "range" },
    ],
    ["no marks", { found: 0, falseAlarms: 0 }, { falseAlarms: "range" }],
    ["six marks", { found: 1, falseAlarms: 5 }, { falseAlarms: "range" }],
    ["number as text", { found: "1" }, { found: "type" }],
    ["fraction", { falseAlarms: 0.5 }, { falseAlarms: "type" }],
    ["negative", { falseAlarms: -1 }, { falseAlarms: "type" }],
    ["boolean as number", { reasonGiven: 1 }, { reasonGiven: "type" }],
    ["boolean as text", { testCorrect: "true" }, { testCorrect: "type" }],
    [
      "extra field",
      { time: "2026-10-11T10:00:00Z" },
      { time: "unknown_field" },
    ],
    ["reason text", { reason: "off by one" }, { reason: "unknown_field" }],
  ];
  for (const [name, overrides, fields] of cases) {
    test(`rejects: ${name}`, () => {
      const result = validateSubmission(valid(overrides), CATALOG);
      assert.deepEqual(result, { ok: false, fields: { ...fields } });
    });
  }

  test("names every missing field", () => {
    const result = validateSubmission({}, CATALOG);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(Object.keys(result.fields).sort(), [
        "falseAlarms",
        "found",
        "lang",
        "questionId",
        "reasonGiven",
        "testCorrect",
        "total",
      ]);
      assert.ok(Object.values(result.fields).every((p) => p === "required"));
    }
  });

  test('keeps a "__proto__" key as a plain unknown field', () => {
    const body = JSON.parse('{"__proto__": {"polluted": true}}') as Record<
      string,
      unknown
    >;
    const result = validateSubmission({ ...valid(), ...body }, CATALOG);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.fields["__proto__"], "unknown_field");
      assert.equal(({} as Record<string, unknown>).polluted, undefined);
    }
  });
});

describe("counter: storage", () => {
  let store: MemoryD1;
  beforeEach(async () => {
    store = await memoryD1();
  });

  const submission = valid() as Submission;

  test("stores only the contract fields, the UTC day and a count", async () => {
    await recordSubmission(store.d1, submission, utcDay(NOW));
    assert.deepEqual(store.dump(), [
      {
        day: "2026-10-11",
        question_id: "q-two",
        lang: "tr",
        found: 1,
        total: 2,
        false_alarms: 1,
        reason_given: 1,
        test_correct: 0,
        submissions: 1,
      },
    ]);
  });

  test("counts the same combination in one row", async () => {
    for (let i = 0; i < 3; i += 1) {
      assert.equal(
        await recordSubmission(store.d1, submission, "2026-10-11"),
        "counted",
      );
    }
    const rows = store.dump();
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.submissions, 3);
  });

  test("stops at the daily cap, per day", async () => {
    const other = { ...submission, lang: "en" as const };
    assert.equal(
      await recordSubmission(store.d1, submission, "2026-10-11", 2),
      "counted",
    );
    assert.equal(
      await recordSubmission(store.d1, other, "2026-10-11", 2),
      "counted",
    );
    assert.equal(
      await recordSubmission(store.d1, submission, "2026-10-11", 2),
      "cap_reached",
    );
    assert.equal(
      await recordSubmission(store.d1, submission, "2026-10-12", 2),
      "counted",
    );
    const total = store
      .dump()
      .reduce((sum, row) => sum + Number(row.submissions), 0);
    assert.equal(total, 3);
  });

  test("keeps counts for 25 months: the cutoff is the same day, 25 months back", () => {
    assert.equal(RETENTION_MONTHS, 25);
    for (const [now, cutoff] of [
      [NOW, "2024-09-11"],
      [Date.UTC(2026, 0, 1, 0, 0, 0), "2023-12-01"],
      [Date.UTC(2028, 1, 29, 12), "2026-01-29"],
      // A day the earlier month lacks rolls forward: never kept longer.
      [Date.UTC(2028, 4, 31, 12), "2026-05-01"],
      [Date.UTC(2028, 2, 30, 12), "2026-03-02"],
    ] as const) {
      assert.equal(retentionCutoff(now), cutoff, utcDay(now));
    }
  });

  test("deletes days before the cutoff, keeps the cutoff day", async () => {
    seedDays(store, ["2024-08-31", "2024-09-10", "2024-09-11", "2026-10-11"]);
    await deleteBefore(store.d1, retentionCutoff(NOW));
    assert.deepEqual(storedDays(store), ["2024-09-11", "2026-10-11"]);
    await deleteBefore(store.d1, retentionCutoff(NOW));
    assert.equal(store.dump().length, 2);
  });

  test("the migration can run again and its rollback removes the table", async () => {
    store.exec(
      `INSERT INTO submission_counts VALUES ('2026-10-11', 'q-one', 'en', 1, 1, 0, 0, 1, 7)`,
    );
    store.exec(await readFile(MIGRATION, "utf8"));
    assert.equal(store.dump()[0]?.submissions, 7);
    store.exec("DROP TABLE IF EXISTS submission_counts;");
    assert.throws(() => store.dump(), /no such table/);
  });

  test("the table refuses values outside the contract", () => {
    for (const values of [
      "'2026-10-11', 'q-one', 'de', 1, 1, 0, 0, 1, 1",
      "'2026-10-11', 'q-one', 'en', 3, 2, 0, 0, 1, 1",
      "'2026-10-11', 'q-one', 'en', 1, 1, 6, 0, 1, 1",
      "'2026-10-11T10:00', 'q-one', 'en', 1, 1, 0, 0, 1, 1",
    ]) {
      assert.throws(
        () => store.exec(`INSERT INTO submission_counts VALUES (${values})`),
        /CHECK constraint failed/,
      );
    }
  });
});

describe("counter: POST /api/submissions", () => {
  let store: MemoryD1;
  let env: Env;
  let errors: ReturnType<typeof captureErrors>;
  beforeEach(async () => {
    store = await memoryD1();
    env = { DB: store.d1 };
    errors = captureErrors();
  });
  afterEach(() => errors.restore());

  test("counts a valid submission: 204, no body, no cookie", async () => {
    const response = await handlers().submit({ request: post(valid()), env });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
    assert.equal(response.headers.get("Set-Cookie"), null);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(store.dump().length, 1);
    assert.deepEqual(errors.lines, []);
  });

  test("keeps nothing from the request headers", async () => {
    const marker = "MARKER-7f3a";
    const request = post(valid(), {
      "Content-Type": "application/json",
      "User-Agent": `Agent ${marker}`,
      Referer: `https://example.test/${marker}`,
      Cookie: `id=${marker}`,
      "Accept-Language": `tr-${marker}`,
      "CF-Connecting-IP": "203.0.113.7",
      "X-Forwarded-For": "203.0.113.7",
      "X-Real-IP": "203.0.113.7",
    });
    const response = await handlers().submit({ request, env });
    assert.equal(response.status, 204);
    const stored = JSON.stringify(store.dump());
    assert.ok(!stored.includes(marker));
    assert.ok(!stored.includes("203.0.113.7"));
    assert.ok(!stored.includes("23:59"));
  });

  test("rejects other methods with 405 and does not touch the database", async () => {
    for (const method of ["GET", "PUT", "DELETE", "OPTIONS"]) {
      const request = new Request(`${BASE}/api/submissions`, { method });
      const response = await handlers().submit({
        request,
        env: { DB: untouchableD1() },
      });
      assert.equal(response.status, 405, method);
      assert.equal(response.headers.get("Allow"), "POST");
      assert.equal((await errorOf(response)).code, "METHOD_NOT_ALLOWED");
    }
  });

  test("answers 503 when the database is not bound", async () => {
    const response = await handlers().submit({
      request: post(valid()),
      env: {},
    });
    assert.equal(response.status, 503);
    assert.equal((await errorOf(response)).code, "NOT_CONFIGURED");
    assert.deepEqual(errors.lines, [
      "[kodprova-sayac] missing setting: DB (D1 binding)",
    ]);
  });

  test("needs JSON content: 415", async () => {
    for (const headers of [
      {},
      { "Content-Type": "text/plain" },
      { "Content-Type": "application/x-www-form-urlencoded" },
    ] as Record<string, string>[]) {
      const response = await handlers().submit({
        request: post(valid(), headers),
        env,
      });
      assert.equal(response.status, 415);
      assert.equal((await errorOf(response)).code, "UNSUPPORTED_MEDIA_TYPE");
    }
    const charset = { "Content-Type": "application/json; charset=utf-8" };
    const response = await handlers().submit({
      request: post(valid(), charset),
      env,
    });
    assert.equal(response.status, 204);
  });

  test("refuses a body over the size limit: 413", async () => {
    const big = JSON.stringify({
      ...valid(),
      pad: "x".repeat(BODY_LIMIT_BYTES),
    });
    const response = await handlers().submit({ request: post(big), env });
    assert.equal(response.status, 413);
    assert.equal((await errorOf(response)).code, "PAYLOAD_TOO_LARGE");
    assert.deepEqual(store.dump(), []);
  });

  test("refuses a body that is not a JSON object: 400 INVALID_REQUEST", async () => {
    for (const body of ["{", "", "[]", "null", '"text"', "42"]) {
      const response = await handlers().submit({ request: post(body), env });
      assert.equal(response.status, 400, body);
      assert.equal((await errorOf(response)).code, "INVALID_REQUEST");
    }
    assert.deepEqual(store.dump(), []);
  });

  test("refuses invalid fields: 400 INVALID_INPUT with the field names", async () => {
    const response = await handlers().submit({
      request: post(valid({ questionId: "no-such-question", extra: 1 })),
      env,
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await errorOf(response), {
      code: "INVALID_INPUT",
      fields: { questionId: "unknown_question", extra: "unknown_field" },
    });
    assert.deepEqual(store.dump(), []);
  });

  test("slows a burst down: 429 TOO_MANY_REQUESTS with Retry-After", async () => {
    const { submit } = handlers({ limiter: rateLimiter(2) });
    for (let i = 0; i < 2; i += 1) {
      assert.equal((await submit({ request: post(valid()), env })).status, 204);
    }
    const response = await submit({ request: post(valid()), env });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "60");
    assert.equal((await errorOf(response)).code, "TOO_MANY_REQUESTS");
  });

  test("a count deletes days older than 25 months, keeps the cutoff day", async () => {
    seedDays(store, ["2024-09-10", "2024-09-11"]);
    const response = await handlers().submit({ request: post(valid()), env });
    assert.equal(response.status, 204);
    assert.deepEqual(storedDays(store), ["2024-09-11", "2026-10-11"]);
  });

  test("stops at the daily cap: 429 DAILY_LIMIT", async () => {
    const { submit } = handlers({ dailyCap: 1 });
    assert.equal((await submit({ request: post(valid()), env })).status, 204);
    const response = await submit({ request: post(valid()), env });
    assert.equal(response.status, 429);
    assert.equal((await errorOf(response)).code, "DAILY_LIMIT");
  });

  test("hides database errors: 500 with no detail, fixed log line", async () => {
    const response = await handlers().submit({
      request: post(valid()),
      env: { DB: failingD1() },
    });
    assert.equal(response.status, 500);
    const text = await response.text();
    assert.equal(text, '{"ok":false,"error":{"code":"SERVER_ERROR"}}');
    assert.deepEqual(errors.lines, [
      "[kodprova-sayac] database error: submission not counted",
    ]);
  });
});

describe("counter: GET /api/summary", () => {
  let store: MemoryD1;
  let env: Env;
  let errors: ReturnType<typeof captureErrors>;
  beforeEach(async () => {
    store = await memoryD1();
    env = { DB: store.d1, SUMMARY_KEY: KEY };
    errors = captureErrors();
  });
  afterEach(() => errors.restore());

  test("without a key: 401, database untouched", async () => {
    for (const headers of [
      {},
      { Authorization: "" },
      { Authorization: `Basic ${KEY}` },
      { Authorization: "Bearer " },
    ] as Record<string, string>[]) {
      const response = await handlers().summary({
        request: summaryRequest("", headers),
        env: { DB: untouchableD1(), SUMMARY_KEY: KEY },
      });
      assert.equal(response.status, 401);
      assert.match(response.headers.get("WWW-Authenticate") ?? "", /^Bearer/);
      assert.equal((await errorOf(response)).code, "UNAUTHORIZED");
    }
  });

  test("the key is not accepted in the address", async () => {
    const response = await handlers().summary({
      request: summaryRequest(`?key=${KEY}`, {}),
      env,
    });
    assert.equal(response.status, 401);
  });

  test("with a wrong key or no usable server key: 403, database untouched", async () => {
    const short = "s".repeat(KEY_MIN_LENGTH - 1);
    for (const [sent, configured] of [
      [`${KEY}x`, KEY],
      [KEY.slice(1), KEY],
      [KEY, undefined],
      [KEY, ""],
      [short, short],
    ] as const) {
      const response = await handlers().summary({
        request: summaryRequest("", { Authorization: `Bearer ${sent}` }),
        env: { DB: untouchableD1(), SUMMARY_KEY: configured },
      });
      assert.equal(response.status, 403);
      assert.equal((await errorOf(response)).code, "FORBIDDEN");
    }
  });

  test("other methods with the key: 405", async () => {
    const response = await handlers().summary({
      request: summaryRequest("", { Authorization: `Bearer ${KEY}` }, "POST"),
      env,
    });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "GET");
  });

  test("refuses a bad date range: 400", async () => {
    for (const [query, fields] of [
      ["?from=2026-13-01", { from: "range" }],
      ["?to=2026-02-30", { to: "range" }],
      ["?from=yesterday", { from: "range" }],
      ["?from=2026-10-12&to=2026-10-11", { to: "range" }],
    ] as const) {
      const response = await handlers().summary({
        request: summaryRequest(query),
        env,
      });
      assert.equal(response.status, 400, query);
      assert.deepEqual(await errorOf(response), {
        code: "INVALID_INPUT",
        fields: { ...fields },
      });
    }
  });

  test("answers 503 without the database and 500 on a database error", async () => {
    const missing = await handlers().summary({
      request: summaryRequest(),
      env: { SUMMARY_KEY: KEY },
    });
    assert.equal(missing.status, 503);
    const failing = await handlers().summary({
      request: summaryRequest(),
      env: { DB: failingD1(), SUMMARY_KEY: KEY },
    });
    assert.equal(failing.status, 500);
    assert.equal(
      await failing.text(),
      '{"ok":false,"error":{"code":"SERVER_ERROR"}}',
    );
  });

  test("sums the counts (hand-computed)", async () => {
    const day1 = Date.UTC(2026, 9, 11, 12);
    const day2 = Date.UTC(2026, 9, 12, 8);
    const sent: [number, Record<string, unknown>][] = [
      // q-two (2 bugs): all found / half found / none found
      [
        day1,
        valid({
          found: 2,
          falseAlarms: 0,
          reasonGiven: true,
          testCorrect: true,
        }),
      ],
      [
        day1,
        valid({
          found: 1,
          falseAlarms: 2,
          reasonGiven: false,
          testCorrect: false,
        }),
      ],
      [
        day2,
        valid({
          lang: "en",
          found: 0,
          falseAlarms: 1,
          reasonGiven: false,
          testCorrect: true,
        }),
      ],
      // q-one (1 bug), twice the same combination
      [
        day2,
        valid({
          questionId: "q-one",
          total: 1,
          found: 1,
          falseAlarms: 0,
          reasonGiven: true,
          testCorrect: true,
        }),
      ],
      [
        day2,
        valid({
          questionId: "q-one",
          total: 1,
          found: 1,
          falseAlarms: 0,
          reasonGiven: true,
          testCorrect: true,
        }),
      ],
    ];
    for (const [time, body] of sent) {
      const { submit } = handlers({ now: () => time });
      assert.equal((await submit({ request: post(body), env })).status, 204);
    }
    // Counts of a question that was removed from the catalog stay visible.
    store.exec(
      `INSERT INTO submission_counts VALUES ('2026-10-10', 'q-old', 'tr', 0, 1, 1, 0, 0, 4)`,
    );

    const response = await handlers().summary({
      request: summaryRequest(),
      env,
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as Record<string, unknown>;
    const sums = (
      s: number,
      tr: number,
      en: number,
      foundBugs: number,
      totalBugs: number,
      allFound: number,
      falseAlarms: number,
      reasonGiven: number,
      testCorrect: number,
    ) => ({
      submissions: s,
      tr,
      en,
      foundBugs,
      totalBugs,
      allFound,
      falseAlarms,
      reasonGiven,
      testCorrect,
    });
    assert.deepEqual(body, {
      ok: true,
      service: "kodprova-sayac",
      schema: 1,
      range: { from: null, to: null },
      firstDay: "2026-10-10",
      lastDay: "2026-10-12",
      dailyCap: 5000,
      capReachedDays: [],
      totals: sums(9, 8, 1, 5, 12, 3, 7, 3, 4),
      byDay: [
        { day: "2026-10-10", submissions: 4, tr: 4, en: 0 },
        { day: "2026-10-11", submissions: 2, tr: 2, en: 0 },
        { day: "2026-10-12", submissions: 3, tr: 2, en: 1 },
      ],
      byQuestion: [
        {
          questionId: "q-one",
          inCatalog: true,
          ...sums(2, 2, 0, 2, 2, 2, 0, 2, 2),
        },
        {
          questionId: "q-two",
          inCatalog: true,
          ...sums(3, 2, 1, 3, 6, 1, 3, 1, 2),
        },
        {
          questionId: "q-old",
          inCatalog: false,
          ...sums(4, 4, 0, 0, 4, 0, 4, 0, 0),
        },
      ],
    });

    const ranged = await handlers().summary({
      request: summaryRequest("?from=2026-10-12&to=2026-10-12"),
      env,
    });
    const rangedBody = (await ranged.json()) as {
      totals: { submissions: number };
      byDay: unknown[];
      range: unknown;
    };
    assert.deepEqual(rangedBody.range, {
      from: "2026-10-12",
      to: "2026-10-12",
    });
    assert.equal(rangedBody.totals.submissions, 3);
    assert.equal(rangedBody.byDay.length, 1);
    assert.deepEqual(errors.lines, []);
  });

  test("lists every catalog question, also with no submissions", async () => {
    const response = await handlers().summary({
      request: summaryRequest(),
      env,
    });
    const body = (await response.json()) as {
      byQuestion: { questionId: string; submissions: number }[];
      firstDay: unknown;
    };
    assert.deepEqual(
      body.byQuestion.map((q) => [q.questionId, q.submissions]),
      [
        ["q-one", 0],
        ["q-two", 0],
      ],
    );
    assert.equal(body.firstDay, null);
  });

  test("deletes days older than 25 months before reading, never shows them", async () => {
    seedDays(store, ["2024-09-10", "2024-09-11", "2026-10-11"]);
    const response = await handlers().summary({
      request: summaryRequest("?from=2024-01-01"),
      env,
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      firstDay: string;
      totals: { submissions: number };
    };
    assert.equal(body.firstDay, "2024-09-11");
    assert.equal(body.totals.submissions, 6);
    assert.deepEqual(storedDays(store), ["2024-09-11", "2026-10-11"]);
  });

  test("marks days that reached the cap", async () => {
    const { submit, summary } = handlers({ dailyCap: 1 });
    await submit({ request: post(valid()), env });
    const body = (await (
      await summary({ request: summaryRequest(), env })
    ).json()) as { capReachedDays: string[] };
    assert.deepEqual(body.capReachedDays, ["2026-10-11"]);
  });
});

/** Every .ts / .js file of the service, with comments removed. */
async function serviceCode(): Promise<Map<string, string>> {
  const root = join(REPO_ROOT, "functions");
  const files = new Map<string, string>();
  for (const entry of await readdir(root, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile() || !/\.(ts|js)$/.test(entry.name)) continue;
    const path = join(entry.parentPath, entry.name);
    const text = await readFile(path, "utf8");
    const code = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    files.set(relative(root, path).replaceAll("\\", "/"), code);
  }
  return files;
}

describe("counter: what the code reads (K19, N-02)", () => {
  test("reads only Content-Type, Content-Length and Authorization", async () => {
    const files = await serviceCode();
    assert.ok(files.size >= 10);
    const read = new Set<string>();
    for (const [file, code] of files) {
      const uses = code.match(/request\.headers/g)?.length ?? 0;
      const gets = [...code.matchAll(/request\.headers\.get\("([^"]+)"\)/g)];
      assert.equal(
        uses,
        gets.length,
        `${file}: request headers used other than .get("…")`,
      );
      for (const [, name] of gets) read.add(String(name));
    }
    assert.deepEqual([...read].sort(), [
      "Authorization",
      "Content-Length",
      "Content-Type",
    ]);
  });

  test("never names IP, browser, referrer, cookie or platform request data", async () => {
    const forbidden =
      /cf-connecting-ip|x-forwarded-for|x-real-ip|true-client-ip|cf-ipcountry|user-agent|sec-ch-ua|referer|cookie|accept-language|\.cf\b|\["cf"\]|navigator|remoteAddress/i;
    for (const [file, code] of await serviceCode()) {
      assert.doesNotMatch(code, forbidden, file);
    }
  });

  test("has exactly two routes", async () => {
    const routesFound = [...(await serviceCode())]
      .filter(([, code]) => /export const onRequest/.test(code))
      .map(([file]) => file)
      .sort();
    assert.deepEqual(routesFound, ["api/submissions.ts", "api/summary.ts"]);
  });
});

describe("counter: Cloudflare Pages build", () => {
  // The Git build bundles functions/ with its own wrangler 3 (esbuild 0.17),
  // which cannot parse import attributes; every file in functions/ is parsed.
  test("uses no import attributes", async () => {
    const attribute = /["']\s*(?:with|assert)\s*\{|\{\s*(?:with|assert)\s*:/;
    for (const [file, code] of await serviceCode()) {
      assert.doesNotMatch(code, attribute, file);
    }
  });
});
