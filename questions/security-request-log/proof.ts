import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

const NOW = new Date("2026-10-10T12:00:00Z");

/** Logs one request and returns the line that was written. */
function logLine(code: typeof Code, request: Code.IncomingRequest): string {
  const lines: string[] = [];
  code.logRequest(request, (line) => lines.push(line), NOW);
  assert.equal(lines.length, 1);
  return lines[0] ?? "";
}

function request(body: Code.Json): Code.IncomingRequest {
  return { method: "POST", path: "/integrations", query: {}, body };
}

export default {
  proofs: {
    "array-not-redacted": (code) => {
      const line = logLine(
        code,
        request({
          name: "Billing",
          credentials: [{ provider: "mail", token: "tok-secret-1" }],
        }),
      );
      assert.ok(!line.includes("tok-secret-1"), "token written to the log");
    },
    "request-modified": (code) => {
      const incoming = request({ name: "Billing", apiKey: "key-123" });
      logLine(code, incoming);
      assert.deepEqual(incoming.body, { name: "Billing", apiKey: "key-123" });
    },
  },
  options: {
    // a: A top-level password is written as "[redacted]".
    a: (code) => {
      const line = logLine(code, request({ user: "ops", password: "pw-1" }));
      assert.ok(line.includes('"password":"[redacted]"'));
      assert.ok(!line.includes("pw-1"));
    },
    // b: An api_key inside a nested object is redacted.
    b: (code) => {
      const line = logLine(
        code,
        request({ settings: { mail: { api_key: "key-456" } } }),
      );
      assert.ok(!line.includes("key-456"));
    },
    // c (correct): A token inside an array of objects is redacted.
    c: (code) => {
      const line = logLine(
        code,
        request({ credentials: [{ provider: "sms", token: "tok-789" }] }),
      );
      assert.ok(!line.includes("tok-789"));
    },
    // d: The line holds the method and the path.
    d: (code) => {
      const entry = JSON.parse(logLine(code, request({ name: "Billing" })));
      assert.equal(entry.method, "POST");
      assert.equal(entry.path, "/integrations");
    },
  },
} satisfies ProofSuite<typeof Code>;
