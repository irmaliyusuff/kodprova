import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

const ORDERS: Code.Order[] = [
  { id: "o1", totalCents: 1200, createdAt: "2026-10-09T23:59:59Z" },
  { id: "o2", totalCents: 4500, createdAt: "2026-10-10T00:00:00Z" },
  { id: "o3", totalCents: 990, createdAt: "2026-10-10T15:00:00Z" },
  { id: "o4", totalCents: 3000, createdAt: "2026-10-11T08:30:00Z" },
  { id: "o5", totalCents: 750, createdAt: "2026-10-12T21:15:00Z" },
];

function ids(answer: ReturnType<typeof Code.ordersInRange>): string[] {
  assert.equal(answer.status, 200);
  const { orders } = answer.body;
  assert.ok(orders !== undefined, "a 200 answer has orders");
  return orders.map((order) => order.id);
}

export default {
  proofs: {
    "last-day-excluded": (code) => {
      const answer = code.ordersInRange(ORDERS, {
        from: "2026-10-10",
        to: "2026-10-11",
      });
      assert.deepEqual(ids(answer), ["o2", "o3", "o4"]);
    },
  },
  options: {
    // a: 10–12 October includes an order from 11 October.
    a: (code) => {
      const answer = code.ordersInRange(ORDERS, {
        from: "2026-10-10",
        to: "2026-10-12",
      });
      assert.ok(ids(answer).includes("o4"));
    },
    // b: A range whose start is after its end answers 400.
    b: (code) => {
      const answer = code.ordersInRange(ORDERS, {
        from: "2026-10-12",
        to: "2026-10-10",
      });
      assert.equal(answer.status, 400);
    },
    // c (correct): from = to = 10 October includes an order at 15:00 that day.
    c: (code) => {
      const answer = code.ordersInRange(ORDERS, {
        from: "2026-10-10",
        to: "2026-10-10",
      });
      assert.ok(ids(answer).includes("o3"));
    },
    // d: 10–12 October leaves out an order from 9 October.
    d: (code) => {
      const answer = code.ordersInRange(ORDERS, {
        from: "2026-10-10",
        to: "2026-10-12",
      });
      assert.ok(!ids(answer).includes("o1"));
    },
  },
} satisfies ProofSuite<typeof Code>;
