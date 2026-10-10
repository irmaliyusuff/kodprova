import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Meta from "./subject.ts";

const text = (length: number) => "a".repeat(length);

// Testing topic: no proofs; the gate runs the original and fixed tests
// against subject.ts and flawed-<bug id>.ts. Options run against the same.
export default {
  options: {
    // a (correct): 119 characters is too short.
    a: (code) => assert.equal(code.descriptionError(text(119)), "too-short"),
    // b: 120 characters is valid.
    b: (code) => assert.equal(code.descriptionError(text(120)), null),
    // c: 10 characters is too short.
    c: (code) => assert.equal(code.descriptionError(text(10)), "too-short"),
    // d: 161 characters is too long.
    d: (code) => assert.equal(code.descriptionError(text(161)), "too-long"),
  },
} satisfies ProofSuite<typeof Meta>;
