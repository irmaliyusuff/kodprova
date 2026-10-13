// The testing topic's order check. A test whose result depends on the tests
// that ran before it can let a broken implementation through in one order and
// catch it in another. Test runners do not agree on an order (node:test,
// Vitest and Jest run tests in file order; the gate's suite checks run
// TypeScript tests alphabetically), so both test files run against every
// implementation in the four orders of TestOrder, and:
//   - every test must give the same result in all four;
//   - no two tests may hand the same array, Date or plain object to the
//     implementation (scripts/runners/shared-inputs.ts). The question's own
//     implementations leave their inputs alone, so sharing changes no result
//     here; but an implementation that changed its input in one test would
//     change the other test's data, and could pass or fail by order.

import type { GateLine } from "./gate.ts";
import type {
  CheckResult,
  PlannedCheck,
  SharedInput,
  TestOrder,
} from "./runner-protocol.ts";

const TEST_ORDERS: readonly TestOrder[] = [
  "file",
  "alphabetical",
  "reverse",
  "alone",
];
/** Problems listed on the gate line; the rest are only counted. */
const SHOWN_PROBLEMS = 3;

type OrderCheck = Extract<PlannedCheck, { kind: "order" }>;

interface OrderRun {
  target: string;
  checks: Record<TestOrder, OrderCheck>;
}

/** One test file against every implementation, in every order. */
export interface OrderClaim {
  label: string;
  runs: OrderRun[];
}

export function planOrderClaim(
  label: string,
  suite: string,
  targets: string[],
  add: (check: Omit<OrderCheck, "id">) => OrderCheck,
): OrderClaim {
  const runs = targets.map((target) => {
    const checks = Object.fromEntries(
      TEST_ORDERS.map((order) => [
        order,
        add({ kind: "order", suite, target, order }),
      ]),
    ) as Record<TestOrder, OrderCheck>;
    return { target, checks };
  });
  return { label, runs };
}

export function judgeOrder(
  claim: OrderClaim,
  results: Map<string, CheckResult>,
): GateLine {
  const differences: string[] = [];
  // From the file order runs, so the tests come in the file's order. The same
  // data is shared whatever the implementation: each pair is listed once.
  const shared = new Map<string, { input: SharedInput; kinds: Set<string> }>();
  for (const run of claim.runs) {
    const failed: Partial<Record<TestOrder, string[]>> = {};
    for (const order of TEST_ORDERS) {
      const result = results.get(run.checks[order].id);
      if (!result?.failedTests) {
        return {
          ok: false,
          text:
            `${claim.label}: could not run in ${order} order on ` +
            `${run.target}: ${result?.error ?? "no result"}`,
        };
      }
      failed[order] = result.failedTests;
      if (order === "file") {
        for (const input of result.sharedInputs ?? []) {
          const key = `${input.tests.join(" ")} ${input.receiver}`;
          const entry = shared.get(key) ?? { input, kinds: new Set<string>() };
          entry.kinds.add(input.kind);
          shared.set(key, entry);
        }
      }
    }
    differences.push(...orderDifferences(run.target, failed));
  }
  const problems = [
    ...differences.map((text, index) =>
      index === 0 ? `order-dependent: ${text}` : text,
    ),
    ...[...shared.values()].map(({ input, kinds }, index) => {
      const text =
        `${input.tests[0]} and ${input.tests[1]} pass the same ` +
        `${listed([...kinds])} to ${input.receiver}`;
      return index === 0 ? `tests share data: ${text}` : text;
    }),
  ];
  if (problems.length === 0) {
    return {
      ok: true,
      text:
        `${claim.label}: same result for every test in file, alphabetical ` +
        "and reverse order and alone; no data shared between tests",
    };
  }
  const more = problems.length - SHOWN_PROBLEMS;
  return {
    ok: false,
    text:
      `${claim.label}: ${problems.slice(0, SHOWN_PROBLEMS).join("; ")}` +
      (more > 0 ? `; and ${more} more` : ""),
  };
}

/** Each test whose result in some order differs from its result alone. */
function orderDifferences(
  target: string,
  failed: Partial<Record<TestOrder, string[]>>,
): string[] {
  const alone = new Set(failed.alone);
  const tests = new Set(TEST_ORDERS.flatMap((order) => failed[order]!));
  return [...tests].flatMap((test) => {
    const orders = TEST_ORDERS.filter(
      (order) => failed[order]!.includes(test) !== alone.has(test),
    );
    if (orders.length === 0) {
      return [];
    }
    const [aloneResult, otherResult] = alone.has(test)
      ? ["fails", "passes"]
      : ["passes", "fails"];
    return [
      `${test} ${aloneResult} alone but ${otherResult} in ` +
        `${listed(orders)} order on ${target}`,
    ];
  });
}

/** "file", "file and reverse", "file, alphabetical and reverse" */
function listed(items: string[]): string {
  return items.length > 1
    ? `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`
    : (items[0] ?? "");
}
