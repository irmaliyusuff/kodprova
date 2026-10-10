/**
 * Request checks: content type and body size.
 *
 * The counter reads exactly three request headers in the whole service:
 * `Content-Type` and `Content-Length` (here) and `Authorization` (key.ts,
 * summary only). IP address, User-Agent, Referer, cookies, language headers
 * and the platform's request metadata (`request.cf`) are never read.
 * A test enforces this list (test/counter.test.ts, "reads only ...").
 */

/** A valid submission is about 150 bytes; the limit leaves room for spacing. */
export const BODY_LIMIT_BYTES = 1024;

/**
 * The body must be sent as `application/json`. Besides naming the format,
 * this keeps other websites out: a browser on another origin has to ask
 * first (CORS preflight) before sending JSON, and the counter never answers
 * that question with a yes.
 */
export function isJson(request: Request): boolean {
  const type = (request.headers.get("Content-Type") ?? "").split(";", 1)[0];
  return (type ?? "").trim().toLowerCase() === "application/json";
}

export type BodyResult = { ok: true; text: string } | { ok: false };

/** Reads at most `limit` bytes of the body and stops reading beyond that. */
export async function readBody(
  request: Request,
  limit: number = BODY_LIMIT_BYTES,
): Promise<BodyResult> {
  const declared = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(declared) && declared > limit) return { ok: false };
  if (request.body === null) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return { ok: false };
    }
    chunks.push(value);
  }

  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(all) };
}
