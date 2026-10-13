import assert from "node:assert/strict";
import type * as Trial from "./subject.ts";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const START = new Date("2020-01-01T12:00:00Z").getTime();
const now = () => new Date(START);
const after = (ms: number) => new Date(START + ms);

export function testActive({ trialState }: typeof Trial) {
  assert.equal(trialState(after(10 * DAY), now()), "active");
  assert.equal(trialState(after(3 * DAY + MINUTE), now()), "active");
}

export function testEndingSoon({ trialState }: typeof Trial) {
  assert.equal(trialState(after(3 * DAY), now()), "ending-soon");
  assert.equal(trialState(after(MINUTE), now()), "ending-soon");
}

export function testExpired({ trialState }: typeof Trial) {
  assert.equal(trialState(now(), now()), "expired");
  assert.equal(trialState(after(-DAY), now()), "expired");
}

export function testDaysLeftRoundsUp({ daysLeft }: typeof Trial) {
  assert.equal(daysLeft(after(14 * DAY), now()), 14);
  assert.equal(daysLeft(after(2 * DAY), now()), 2);
  assert.equal(daysLeft(after(2 * DAY + MINUTE), now()), 3);
}

export function testDaysLeftAfterEnd({ daysLeft }: typeof Trial) {
  assert.equal(daysLeft(now(), now()), 0);
  assert.equal(daysLeft(after(-2 * DAY), now()), 0);
}
