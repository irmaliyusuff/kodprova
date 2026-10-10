import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Users from "./subject.ts";

const USERS: Users.User[] = [
  { name: "Ada", active: true },
  { name: "Linus", active: false },
  { name: "Grace", active: true },
];

// Testing topic: no proofs; the gate runs the original and fixed tests
// against subject.ts and flawed-<bug id>.ts. Options run against the same.
export default {
  options: {
    // a: An empty list gives an empty list.
    a: (code) => assert.deepEqual(code.activeUsers([]), []),
    // b: Every user returned is active.
    b: (code) => {
      for (const user of code.activeUsers(USERS)) {
        assert.equal(user.active, true);
      }
    },
    // c (correct): The result is exactly Ada and Grace, in that order.
    c: (code) =>
      assert.deepEqual(
        code.activeUsers(USERS).map((user) => user.name),
        ["Ada", "Grace"],
      ),
    // d: The input list is left unchanged.
    d: (code) => {
      const before = structuredClone(USERS);
      code.activeUsers(USERS);
      assert.deepEqual(USERS, before);
    },
  },
} satisfies ProofSuite<typeof Users>;
