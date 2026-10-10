export type Json =
  null | boolean | number | string | Json[] | { [key: string]: Json };

export interface IncomingRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body: Json;
}

const SECRET_PARTS = ["password", "token", "secret", "apikey"];
const MASK = "[redacted]";

function isSecretKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, "");
  return SECRET_PARTS.some((part) => normalized.includes(part));
}

export function redact(value: Json): Json {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  for (const key of Object.keys(value)) {
    if (isSecretKey(key)) {
      value[key] = MASK;
    } else {
      value[key] = redact(value[key] ?? null);
    }
  }
  return value;
}

export function logRequest(
  request: IncomingRequest,
  write: (line: string) => void,
  now: Date,
): void {
  const { method, path, query, body } = request;
  write(
    JSON.stringify({
      at: now.toISOString(),
      method,
      path,
      query: redact(query),
      body: redact(body),
    }),
  );
}
