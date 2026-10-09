import assert from "node:assert/strict";
import type { ProofSuite } from "../../../../scripts/lib/proof-suite.ts";
import type * as Pricing from "./subject.ts";

// Testing topic: no proofs; the gate runs the original and fixed tests
// against subject.ts and flawed-<bug id>.ts. Options run against the same.
export default {
  options: {
    a: (code) => assert.equal(code.applyDiscount(200, 0), 200),
    b: (code) => assert.equal(code.applyDiscount(200, 10), 180),
    c: (code) => assert.throws(() => code.applyDiscount(200, 150), RangeError),
  },
} satisfies ProofSuite<typeof Pricing>;
