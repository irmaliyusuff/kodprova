import assert from "node:assert/strict";
import type * as Users from "./subject.ts";

const makeUsers = (): Users.User[] => [
  { name: "Ada", active: true },
  { name: "Linus", active: false },
  { name: "Grace", active: true },
];

export function testReturnsOnlyActiveUsers({ activeUsers }: typeof Users) {
  const names = activeUsers(makeUsers()).map((user) => user.name);
  assert.deepEqual(names, ["Ada", "Grace"]);
}

export function testEmptyList({ activeUsers }: typeof Users) {
  assert.deepEqual(activeUsers([]), []);
}

export function testLeavesInputUnchanged({ activeUsers }: typeof Users) {
  const input = makeUsers();
  activeUsers(input);
  assert.deepEqual(input, makeUsers());
}
