/**
 * One response shape for every endpoint.
 *   Success with data: { "ok": true, ... }
 *   Error:             { "ok": false, "error": { "code": "...", "fields"?: { field: problem } } }
 * Error codes, never messages: the site shows its own text (or nothing).
 * Internal details (stack traces, SQL, setting names) never reach the client.
 */
import type { FieldProblem } from "./submission.ts";

export type ErrorCode =
  | "INVALID_INPUT"
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "METHOD_NOT_ALLOWED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "TOO_MANY_REQUESTS"
  | "DAILY_LIMIT"
  | "SERVER_ERROR"
  | "NOT_CONFIGURED";

const COMMON_HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex",
};

export function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...COMMON_HEADERS,
      ...headers,
    },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: COMMON_HEADERS });
}

export function error(
  status: number,
  code: ErrorCode,
  options: {
    fields?: Record<string, FieldProblem>;
    headers?: Record<string, string>;
  } = {},
): Response {
  const body: { code: ErrorCode; fields?: Record<string, FieldProblem> } = {
    code,
  };
  if (options.fields) body.fields = options.fields;
  return json(status, { ok: false, error: body }, options.headers);
}
