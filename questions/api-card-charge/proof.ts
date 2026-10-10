import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

/** A card service and a shared answer store, both answering asynchronously. */
function fakes(decline = false) {
  const charged: string[] = [];
  const stored = new Map<string, Code.ChargeAnswer>();
  const deps: Code.Dependencies = {
    chargeCard: async (accountId) => {
      charged.push(accountId);
      await new Promise((resolve) => setTimeout(resolve, 5));
      return decline
        ? { ok: false, reason: "card_declined" }
        : { ok: true, chargeId: `ch_${charged.length}` };
    },
    answers: {
      get: async (key) => stored.get(key),
      set: async (key, answer) => {
        stored.set(key, answer);
      },
    },
  };
  return { deps, charged };
}

const ALICE = { accountId: "acct_a", idempotencyKey: "k-1", amountCents: 500 };

export default {
  proofs: {
    "concurrent-double-charge": async (code) => {
      const { deps, charged } = fakes();
      const handle = code.createChargeHandler(deps);
      const [first, second] = await Promise.all([handle(ALICE), handle(ALICE)]);
      assert.deepEqual(charged, ["acct_a"], "one card charge");
      assert.deepEqual(first, second);
    },
    "key-not-per-account": async (code) => {
      const { deps, charged } = fakes();
      const handle = code.createChargeHandler(deps);
      const alice = await handle(ALICE);
      const bob = await handle({ ...ALICE, accountId: "acct_b" });
      assert.deepEqual(charged, ["acct_a", "acct_b"], "both accounts charged");
      assert.notEqual(bob.body.chargeId, alice.body.chargeId);
    },
  },
  options: {
    // a: Two requests with the same key, one after the other, charge once
    // and get the same answer.
    a: async (code) => {
      const { deps, charged } = fakes();
      const handle = code.createChargeHandler(deps);
      const first = await handle(ALICE);
      const second = await handle(ALICE);
      assert.equal(charged.length, 1);
      assert.deepEqual(second, first);
    },
    // b (correct): Two requests with the same key sent at the same time
    // charge the card once.
    b: async (code) => {
      const { deps, charged } = fakes();
      const handle = code.createChargeHandler(deps);
      await Promise.all([handle(ALICE), handle(ALICE)]);
      assert.equal(charged.length, 1);
    },
    // c: An amount of 0 answers 400 and charges nothing.
    c: async (code) => {
      const { deps, charged } = fakes();
      const handle = code.createChargeHandler(deps);
      const answer = await handle({ ...ALICE, amountCents: 0 });
      assert.equal(answer.status, 400);
      assert.equal(charged.length, 0);
    },
    // d: A declined card answers 402.
    d: async (code) => {
      const { deps } = fakes(true);
      const answer = await code.createChargeHandler(deps)(ALICE);
      assert.equal(answer.status, 402);
    },
  },
} satisfies ProofSuite<typeof Code>;
