import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Users from "./subject.ts";

const makeUsers = (): Users.User[] => [
  { name: "Ada", active: true },
  { name: "Linus", active: false },
  { name: "Grace", active: true },
];

// Testing topic: no proofs; the gate runs the original and fixed tests
// against subject.ts and flawed-<bug id>.ts. Options run against the same.
// Every check builds its own list, so no check depends on another's input.
export default {
  options: {
    // a: An empty list gives an empty list.
    a: (code) => assert.deepEqual(code.activeUsers([]), []),
    // b: Every user returned is active.
    b: (code) => {
      for (const user of code.activeUsers(makeUsers())) {
        assert.equal(user.active, true);
      }
    },
    // c (correct): The result is exactly Ada and Grace, in that order.
    c: (code) =>
      assert.deepEqual(
        code.activeUsers(makeUsers()).map((user) => user.name),
        ["Ada", "Grace"],
      ),
    // d: The input list is left unchanged.
    d: (code) => {
      const input = makeUsers();
      code.activeUsers(input);
      assert.deepEqual(input, makeUsers());
    },
  },
} satisfies ProofSuite<typeof Users>;
