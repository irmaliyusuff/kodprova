/**
 * The summary key.
 *
 * The key lives only in the `SUMMARY_KEY` secret (Cloudflare dashboard,
 * local `.dev.vars`), never in code or the repository. It is accepted only
 * in the `Authorization: Bearer ...` header, not in the address, so it does
 * not end up in browser history or request logs.
 *
 * The comparison runs on the SHA-256 digests of both values, over the full
 * length, without stopping early: response time does not reveal how much of
 * the key matched. Digests use the built-in Web Crypto, the same code path
 * on Workers and in Node tests.
 */

/** A shorter configured key counts as no key: the summary stays closed. */
export const KEY_MIN_LENGTH = 24;

const BEARER = /^Bearer[ ]+(\S+)[ ]*$/;

/** The key sent with the request, or null when there is none. */
export function keyFromRequest(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (header === null) return null;
  return BEARER.exec(header)?.[1] ?? null;
}

async function digest(text: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

export async function keyMatches(
  sent: string,
  configured: string | undefined,
): Promise<boolean> {
  const expected = (configured ?? "").trim();
  if (expected.length < KEY_MIN_LENGTH) return false;

  const [a, b] = await Promise.all([digest(sent), digest(expected)]);
  let difference = 0;
  for (let i = 0; i < b.length; i += 1) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return difference === 0;
}
