import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

const SIGNUP: Code.AnalyticsEvent = {
  name: "signup",
  payload: { plan: "free" },
};

function memoryStore(): Code.PendingStore {
  let pending: Code.PendingEvent[] = [];
  return {
    load: () => pending,
    save: (next) => {
      pending = next;
    },
  };
}

/** A fake API that answers each request with the next status (the last one repeats). */
function fakeServer(...answers: Array<number | "network-error">) {
  const received: string[] = [];
  const send: Code.Send = async (event) => {
    received.push(event.name);
    const answer =
      answers[Math.min(received.length, answers.length) - 1] ?? 200;
    if (answer === "network-error") {
      throw new TypeError("fetch failed");
    }
    return new Response(null, { status: answer });
  };
  return { send, received };
}

export default {
  proofs: {
    "server-error-dropped": async (code) => {
      const store = memoryStore();
      const server = fakeServer(500, 200);
      await code.track(SIGNUP, store, server.send);
      await code.retryPending(store, server.send);
      assert.deepEqual(
        server.received,
        ["signup", "signup"],
        "a 500 must be retried",
      );
      assert.deepEqual(store.load(), []);
    },
    "attempt-limit": async (code) => {
      const store = memoryStore();
      const server = fakeServer("network-error");
      await code.track(SIGNUP, store, server.send);
      for (let pageLoad = 0; pageLoad < 4; pageLoad += 1) {
        await code.retryPending(store, server.send);
      }
      assert.equal(server.received.length, 3, "at most 3 attempts in total");
      assert.deepEqual(store.load(), []);
    },
  },
  options: {
    // a: When the server answers 200, nothing is left pending.
    a: async (code) => {
      const store = memoryStore();
      await code.track(SIGNUP, store, fakeServer(200).send);
      assert.deepEqual(store.load(), []);
    },
    // b: When the network fails, the event is kept for the next page load.
    b: async (code) => {
      const store = memoryStore();
      await code.track(SIGNUP, store, fakeServer("network-error").send);
      assert.equal(store.load().length, 1);
    },
    // c (correct): When the server answers 503, the event is kept.
    c: async (code) => {
      const store = memoryStore();
      await code.track(SIGNUP, store, fakeServer(503).send);
      assert.equal(store.load().length, 1);
    },
    // d: With nothing pending, a retry sends no request.
    d: async (code) => {
      const server = fakeServer(200);
      await code.retryPending(memoryStore(), server.send);
      assert.equal(server.received.length, 0);
    },
  },
} satisfies ProofSuite<typeof Code>;
