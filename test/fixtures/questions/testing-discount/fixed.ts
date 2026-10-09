import assert from "node:assert/strict";
import type * as Pricing from "./subject.ts";

export function testTenPercentOff({ applyDiscount }: typeof Pricing) {
  assert.equal(applyDiscount(200, 10), 180);
}

export function testZeroPercent({ applyDiscount }: typeof Pricing) {
  assert.equal(applyDiscount(200, 0), 200);
}

export function testRejectsOver100({ applyDiscount }: typeof Pricing) {
  assert.throws(() => applyDiscount(200, 150), RangeError);
}
