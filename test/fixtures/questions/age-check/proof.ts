import assert from "node:assert/strict";
import type { ProofSuite } from "../../../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

export default {
  proofs: {
    "upper-bound": (code) => assert.equal(code.isValidAge(65), true),
    "partial-parse": (code) => assert.equal(code.isValidAge("30abc"), false),
  },
  options: {
    a: (code) => assert.equal(code.isValidAge(30), true),
    b: (code) => assert.equal(code.isValidAge("30abc"), false),
    c: (code) => assert.equal(code.isValidAge(-1), false),
    d: (code) => assert.equal(code.isValidAge("40"), true),
  },
} satisfies ProofSuite<typeof Code>;
