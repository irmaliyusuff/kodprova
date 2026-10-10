/**
 * The two endpoints as functions of their dependencies, so tests can give
 * them a small catalog, a fixed clock and an in-memory database. The route
 * files in `functions/api/` only wire in the real catalog.
 */
import type { Catalog } from "./catalog.ts";
import { keyFromRequest, keyMatches } from "./key.ts";
import { isJson, readBody } from "./request.ts";
import { error, json, noContent } from "./responses.ts";
import { RATE_WINDOW_MS, rateLimiter, type RateLimiter } from "./rate.ts";
import {
  DAILY_CAP,
  readSums,
  recordSubmission,
  utcDay,
  type DateRange,
} from "./store.ts";
import { isPlainObject, validateSubmission } from "./submission.ts";
import { summarize } from "./summary.ts";
import type { Handler } from "./types.ts";

export const SERVICE_NAME = "kodprova-sayac";

export interface Options {
  catalog: Catalog;
  /** Current time in ms; only its UTC day is ever stored. */
  now?: () => number;
  limiter?: RateLimiter;
  dailyCap?: number;
}

/**
 * POST /api/submissions: counts one submitted question.
 *
 * Order: method -> database binding -> content type -> body size -> JSON ->
 * fields -> rate limit -> count. Nothing from the request is logged.
 */
export function submissionsHandler(options: Options): Handler {
  const now = options.now ?? Date.now;
  const limiter = options.limiter ?? rateLimiter();
  const dailyCap = options.dailyCap ?? DAILY_CAP;

  return async ({ request, env }) => {
    if (request.method !== "POST") {
      return error(405, "METHOD_NOT_ALLOWED", { headers: { Allow: "POST" } });
    }
    if (env.DB === undefined) {
      console.error(`[${SERVICE_NAME}] missing setting: DB (D1 binding)`);
      return error(503, "NOT_CONFIGURED");
    }
    if (!isJson(request)) return error(415, "UNSUPPORTED_MEDIA_TYPE");

    const body = await readBody(request);
    if (!body.ok) return error(413, "PAYLOAD_TOO_LARGE");

    let data: unknown;
    try {
      data = JSON.parse(body.text);
    } catch {
      return error(400, "INVALID_REQUEST");
    }
    if (!isPlainObject(data)) return error(400, "INVALID_REQUEST");

    const result = validateSubmission(data, options.catalog);
    if (!result.ok) {
      return error(400, "INVALID_INPUT", { fields: result.fields });
    }

    const time = now();
    if (!limiter.allow(time)) {
      return error(429, "TOO_MANY_REQUESTS", {
        headers: { "Retry-After": String(RATE_WINDOW_MS / 1000) },
      });
    }

    try {
      const outcome = await recordSubmission(
        env.DB,
        result.submission,
        utcDay(time),
        dailyCap,
      );
      return outcome === "counted" ? noContent() : error(429, "DAILY_LIMIT");
    } catch {
      // The error text is not logged: it may contain values from the request.
      console.error(`[${SERVICE_NAME}] database error: submission not counted`);
      return error(500, "SERVER_ERROR");
    }
  };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function isDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  // 2026-02-30 is NaN in some engines and rolls over to March in others.
  return !Number.isNaN(ms) && utcDay(ms) === value;
}

type RangeResult =
  | { ok: true; range: DateRange }
  | { ok: false; fields: Record<string, "range"> };

/** Optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` (UTC days, both inclusive). */
function rangeFrom(url: URL): RangeResult {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const fields: Record<string, "range"> = {};
  if (from !== null && !isDay(from)) fields.from = "range";
  if (to !== null && !isDay(to)) fields.to = "range";
  if (from !== null && to !== null && from > to) fields.to = "range";
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, range: { from, to } };
}

/**
 * GET /api/summary: sums for Yusuf, behind the `SUMMARY_KEY` secret.
 *
 * No key: 401. Wrong key, or no usable key configured on the server: 403.
 * The key is checked before anything else, and before the database.
 */
export function summaryHandler(options: Options): Handler {
  const dailyCap = options.dailyCap ?? DAILY_CAP;

  return async ({ request, env }) => {
    const sent = keyFromRequest(request);
    if (sent === null) {
      return error(401, "UNAUTHORIZED", {
        headers: { "WWW-Authenticate": 'Bearer realm="summary"' },
      });
    }
    if (!(await keyMatches(sent, env.SUMMARY_KEY))) {
      return error(403, "FORBIDDEN");
    }
    if (request.method !== "GET") {
      return error(405, "METHOD_NOT_ALLOWED", { headers: { Allow: "GET" } });
    }
    const range = rangeFrom(new URL(request.url));
    if (!range.ok) return error(400, "INVALID_INPUT", { fields: range.fields });
    if (env.DB === undefined) {
      console.error(`[${SERVICE_NAME}] missing setting: DB (D1 binding)`);
      return error(503, "NOT_CONFIGURED");
    }

    try {
      const sums = await readSums(env.DB, range.range);
      return json(200, {
        ok: true,
        service: SERVICE_NAME,
        ...summarize(options.catalog, sums, range.range, dailyCap),
      });
    } catch {
      console.error(`[${SERVICE_NAME}] database error: summary not read`);
      return error(500, "SERVER_ERROR");
    }
  };
}
