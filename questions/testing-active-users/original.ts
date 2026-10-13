import assert from "node:assert/strict";
import type * as Users from "./subject.ts";

const makeUsers = (): Users.User[] => [
  { name: "Ada", active: true },
  { name: "Linus", active: false },
  { name: "Grace", active: true },
];

export function testReturnsOnlyActiveUsers({ activeUsers }: typeof Users) {
  for (const user of activeUsers(makeUsers())) {
    assert.equal(user.active, true);
  }
}

export function testEmptyList({ activeUsers }: typeof Users) {
  assert.deepEqual(activeUsers([]), []);
}

export function testLeavesInputUnchanged({ activeUsers }: typeof Users) {
  const input = makeUsers();
  activeUsers(input);
  assert.deepEqual(input, makeUsers());
}
