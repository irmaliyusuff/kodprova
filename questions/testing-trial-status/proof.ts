import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Trial from "./subject.ts";

const DAY = 24 * 60 * 60 * 1000;
/** 2020-01-01 12:00 UTC; a new Date on every call, so no check shares one. */
const fixedNow = () => new Date("2020-01-01T12:00:00Z");

/** A time `days` days after `from`. */
const plusDays = (from: Date, days: number) =>
  new Date(from.getTime() + days * DAY);

// Testing topic: no proofs; the gate runs the original and fixed tests
// against subject.ts and flawed-<bug id>.ts. Options run against the same.
export default {
  options: {
    // a: With now fixed at 2020-01-01 12:00 UTC, a trial that ended two days
    // earlier has 0 days left.
    a: (code) =>
      assert.equal(code.daysLeft(plusDays(fixedNow(), -2), fixedNow()), 0),
    // b (correct): With now fixed at 2020-01-01 12:00 UTC, a trial that ends
    // two days later has 2 days left.
    b: (code) =>
      assert.equal(code.daysLeft(plusDays(fixedNow(), 2), fixedNow()), 2),
    // c: With now = new Date(), a trial ending in 2 days and 1 minute has 3
    // days left.
    c: (code) => {
      const now = new Date();
      const endsAt = new Date(now.getTime() + 2 * DAY + 60_000);
      assert.equal(code.daysLeft(endsAt, now), 3);
    },
    // d: With now = new Date(), a trial ending in exactly 3 days is
    // "ending-soon".
    d: (code) => {
      const now = new Date();
      assert.equal(code.trialState(plusDays(now, 3), now), "ending-soon");
    },
  },
} satisfies ProofSuite<typeof Trial>;
