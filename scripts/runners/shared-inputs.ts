// Watches the data a test file hands to an implementation, for the testing
// topic's order check (scripts/lib/test-order.ts). If two tests hand over the
// same array, Date or plain object, an implementation that changes its input
// in one test also changes the other test's data, and the results of the two
// then depend on the order they run in. All tests of an order check run in
// one copy of the test file, so a value they share is the same object.
//
// Values are followed into arrays, plain objects, Maps and Sets. Objects with
// methods (fakes such as a mailer) and class instances are not data and are
// not followed; frozen arrays and objects cannot change and are not recorded.
// scripts/runners/run_python.py does the same for Python lists, dicts and sets.

import type { SharedInput } from "../lib/runner-protocol.ts";

type Module = Record<string, unknown>;
type Callable = (...args: unknown[]) => unknown;

export interface InputWatch {
  /** The module, with every function recording its arguments. */
  module: Module;
  /** Names the test that the calls from now on belong to. */
  startTest(name: string): void;
  /** Data that reached the module from more than one test. */
  shared: SharedInput[];
}

export function watchInputs(module: Module): InputWatch {
  const firstTest = new WeakMap<object, string>();
  const shared: SharedInput[] = [];
  let test = "";

  const record = (value: unknown, receiver: string, seen: Set<object>) => {
    const kind = dataKind(value);
    if (kind === null || seen.has(value as object)) {
      return;
    }
    const data = value as object;
    seen.add(data);
    // Freezing protects an array's or object's own entries, not a Date's time
    // or a Map's or Set's contents.
    const unchangeable =
      (kind === "array" || kind === "object") && Object.isFrozen(data);
    const owner = firstTest.get(data);
    if (owner === undefined) {
      if (!unchangeable) {
        firstTest.set(data, test);
      }
    } else if (
      owner !== test &&
      !shared.some(
        (item) =>
          item.tests[0] === owner &&
          item.tests[1] === test &&
          item.kind === kind &&
          item.receiver === receiver,
      )
    ) {
      shared.push({ kind, tests: [owner, test], receiver });
    }
    for (const item of contents(data)) {
      record(item, receiver, seen);
    }
  };

  const watched = (fn: Callable, name: string) =>
    function (this: unknown, ...args: unknown[]) {
      const seen = new Set<object>();
      args.forEach((arg) => record(arg, name, seen));
      return new.target ? Reflect.construct(fn, args) : fn.apply(this, args);
    };

  return {
    module: Object.fromEntries(
      Object.entries(module).map(([name, value]) => [
        name,
        typeof value === "function" ? watched(value as Callable, name) : value,
      ]),
    ),
    startTest: (name) => {
      test = name;
    },
    shared,
  };
}

/** "array", "Date", "Map", "Set" or "object" for data; null for anything else. */
function dataKind(value: unknown): SharedInput["kind"] | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (value instanceof Date) {
    return "Date";
  }
  if (value instanceof Map) {
    return "Map";
  }
  if (value instanceof Set) {
    return "Set";
  }
  const prototype = Object.getPrototypeOf(value);
  const plain = prototype === Object.prototype || prototype === null;
  return plain &&
    Object.values(value).every((item) => typeof item !== "function")
    ? "object"
    : null;
}

function contents(data: object): unknown[] {
  if (data instanceof Map) {
    return [...data.keys(), ...data.values()];
  }
  if (data instanceof Date) {
    return [];
  }
  return data instanceof Set ? [...data] : Object.values(data);
}
