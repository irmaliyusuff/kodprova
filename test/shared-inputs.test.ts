import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { watchInputs } from "../scripts/runners/shared-inputs.ts";

/** Calls `count` once per test, handing it what `input` returns for that test. */
function run(tests: Record<string, () => unknown>) {
  const watch = watchInputs({ count: (value: unknown) => value });
  const count = watch.module.count as (value: unknown) => unknown;
  for (const [name, input] of Object.entries(tests)) {
    watch.startTest(name);
    count(input());
  }
  return watch.shared;
}

describe("shared test data", () => {
  test("reports a value two tests hand over", () => {
    const users = [{ name: "Ada" }];
    assert.deepEqual(run({ testA: () => users, testB: () => users }), [
      { kind: "array", tests: ["testA", "testB"], receiver: "count" },
      { kind: "object", tests: ["testA", "testB"], receiver: "count" },
    ]);
  });

  test("finds shared objects inside fresh arrays, Maps and Sets", () => {
    const ada = { name: "Ada" };
    const day = new Date(0);
    const shared = run({
      testA: () => [ada],
      testB: () => new Map([["ada", ada]]),
      testC: () => new Set([{ day }]),
      testD: () => ({ when: day }),
    });
    assert.deepEqual(
      shared.map(({ kind, tests }) => `${kind} ${tests.join(" ")}`),
      ["object testA testB", "Date testC testD"],
    );
  });

  test("says nothing when every test builds its own data", () => {
    const makeUsers = () => [{ name: "Ada" }];
    assert.deepEqual(run({ testA: makeUsers, testB: makeUsers }), []);
  });

  test("lets one test hand the same value over more than once", () => {
    const watch = watchInputs({ count: () => 0 });
    const count = watch.module.count as (value: unknown) => number;
    const users = [{ name: "Ada" }];
    watch.startTest("testA");
    count(users);
    count(users);
    assert.deepEqual(watch.shared, []);
  });

  test("ignores fakes, values that cannot change and plain values", () => {
    const fake = { send: async () => {} };
    const frozen = Object.freeze([1, 2, 3]);
    const shared = run({
      testA: () => [fake, frozen, "text", 1],
      testB: () => [fake, frozen, "text", 1],
    });
    assert.deepEqual(shared, []);
  });

  test("still reports a frozen Date, whose time can change", () => {
    const now = Object.freeze(new Date(0));
    assert.deepEqual(
      run({ testA: () => now, testB: () => now }).map(({ kind }) => kind),
      ["Date"],
    );
  });

  test("leaves the module's behaviour alone", async () => {
    class Counter {
      start: number;
      constructor(start = 0) {
        this.start = start;
      }
    }
    const watch = watchInputs({
      add: (a: number, b: number) => a + b,
      later: async (value: string) => value,
      Counter,
      LIMIT: 3,
    });
    const module = watch.module as {
      add: (a: number, b: number) => number;
      later: (value: string) => Promise<string>;
      Counter: typeof Counter;
      LIMIT: number;
    };
    assert.equal(module.add(1, 2), 3);
    assert.equal(await module.later("x"), "x");
    assert.equal(new module.Counter(5).start, 5);
    assert.equal(module.LIMIT, 3);
  });
});
