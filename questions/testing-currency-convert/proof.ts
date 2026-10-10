import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Pricing from "./subject.ts";

/** A rate service that knows only the given pairs ("EUR>USD"). */
function knownRates(table: Record<string, number>): Pricing.RateSource {
  return {
    rate: async (from, to) => {
      const rate = table[`${from}>${to}`];
      if (rate === undefined) {
        throw new Error(`no rate for ${from}>${to}`);
      }
      return rate;
    },
  };
}

// Testing topic: no proofs; the gate runs the original and fixed tests
// against subject.ts and flawed-<bug id>.ts. Options run against the same.
export default {
  options: {
    // a: 10 EUR to EUR is 10 and asks for no rate.
    a: async (code) => {
      const none = knownRates({});
      assert.equal(await code.convertPrice(10, "EUR", "EUR", none), 10);
    },
    // b: With a service that always answers 1.25, 0.99 EUR to USD is 1.24.
    b: async (code) => {
      const always: Pricing.RateSource = { rate: async () => 1.25 };
      assert.equal(await code.convertPrice(0.99, "EUR", "USD", always), 1.24);
    },
    // c: When the rate service fails, the conversion fails with its error.
    c: async (code) => {
      const failing: Pricing.RateSource = {
        rate: async () => {
          throw new Error("rate service down");
        },
      };
      await assert.rejects(
        code.convertPrice(10, "EUR", "USD", failing),
        /rate service down/,
      );
    },
    // d (correct): With a service that knows only EUR>USD = 1.25 and
    // USD>EUR = 0.8, 10 EUR to USD is 12.5.
    d: async (code) => {
      const table = knownRates({ "EUR>USD": 1.25, "USD>EUR": 0.8 });
      assert.equal(await code.convertPrice(10, "EUR", "USD", table), 12.5);
    },
  },
} satisfies ProofSuite<typeof Pricing>;
