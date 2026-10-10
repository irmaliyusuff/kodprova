import assert from "node:assert/strict";
import type * as Pricing from "./subject.ts";

const RATES: Record<string, number> = { "EUR>USD": 1.25, "USD>EUR": 0.8 };
const rates: Pricing.RateSource = {
  rate: async (from, to) => {
    const rate = RATES[`${from}>${to}`];
    if (rate === undefined) {
      throw new Error(`no rate for ${from}>${to}`);
    }
    return rate;
  },
};

export async function testConvertsWithRate({ convertPrice }: typeof Pricing) {
  assert.equal(await convertPrice(10, "EUR", "USD", rates), 12.5);
}

export async function testRoundsToCents({ convertPrice }: typeof Pricing) {
  assert.equal(await convertPrice(0.99, "EUR", "USD", rates), 1.24);
}

export async function testSameCurrency({ convertPrice }: typeof Pricing) {
  let lookups = 0;
  const counting: Pricing.RateSource = {
    rate: async () => {
      lookups += 1;
      return 2;
    },
  };
  assert.equal(await convertPrice(10, "EUR", "EUR", counting), 10);
  assert.equal(lookups, 0);
}

export async function testRateFailure({ convertPrice }: typeof Pricing) {
  const failing: Pricing.RateSource = {
    rate: async () => {
      throw new Error("rate service down");
    },
  };
  await assert.rejects(
    convertPrice(10, "EUR", "USD", failing),
    /rate service down/,
  );
}
