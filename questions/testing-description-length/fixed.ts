import assert from "node:assert/strict";
import type * as Meta from "./subject.ts";

/** A description of exactly `length` characters. */
const text = (length: number) => "a".repeat(length);

export function testAcceptsTypicalLength({ descriptionError }: typeof Meta) {
  assert.equal(descriptionError(text(140)), null);
}

export function testRejectsShortText({ descriptionError }: typeof Meta) {
  assert.equal(descriptionError(text(119)), "too-short");
  assert.equal(descriptionError(text(120)), null);
}

export function testAcceptsUpperLimit({ descriptionError }: typeof Meta) {
  assert.equal(descriptionError(text(160)), null);
}

export function testRejectsLongText({ descriptionError }: typeof Meta) {
  assert.equal(descriptionError(text(161)), "too-long");
}

export function testTrimsSpaces({ descriptionError }: typeof Meta) {
  assert.equal(descriptionError(`  ${text(160)}  `), null);
  assert.equal(descriptionError(" ".repeat(150)), "too-short");
}
