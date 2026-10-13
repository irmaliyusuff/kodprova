// node scripts/runners/run-js.ts < plan.json
// Runs a TypeScript or JavaScript question's checks (see
// scripts/lib/runner-protocol.ts) and prints one "PROOF_RESULT {json}" line.

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  CHECK_TIMEOUT_MS,
  OFFSET_PROBE_SECONDS,
  RANDOM_SEED,
  RESULT_MARKER,
  type CheckResult,
  type PlannedCheck,
  type RunnerOutput,
  type RunPlan,
} from "../lib/runner-protocol.ts";
import { watchInputs } from "./shared-inputs.ts";

type Module = Record<string, unknown>;
type Check = (code: unknown) => unknown;
type OrderCheck = Extract<PlannedCheck, { kind: "order" }>;

/** In a test file, every exported function whose name starts with "test" is a test. */
const TEST_NAME = /^test/;

/** The test functions of a test module, sorted by name (as a module lists its exports). */
function testFunctions(suite: Module): Array<[string, Check]> {
  return Object.entries(suite).filter(
    ([name, value]) => TEST_NAME.test(name) && typeof value === "function",
  ) as Array<[string, Check]>;
}

function emit(output: Omit<RunnerOutput, "utcOffsetMinutes">): void {
  const utcOffsetMinutes = -new Date(
    OFFSET_PROBE_SECONDS * 1000,
  ).getTimezoneOffset();
  console.log(
    `${RESULT_MARKER}${JSON.stringify({ ...output, utcOffsetMinutes })}`,
  );
}

function errorText(error: unknown): string {
  const text =
    error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return text.split("\n")[0] ?? text;
}

/** mulberry32: a small seeded generator, so code using Math.random repeats. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function checkGroup(proof: Module | undefined, group: string): Module {
  const value = (proof?.default as Module | undefined)?.[group] ?? {};
  if (typeof value !== "object" || value === null) {
    throw new Error(`proof file: "${group}" must be an object of functions`);
  }
  for (const [key, check] of Object.entries(value)) {
    if (typeof check !== "function") {
      throw new Error(`proof file: "${group}.${key}" must be a function`);
    }
  }
  return value as Module;
}

async function withTimeout(work: () => unknown): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS} ms`)),
      CHECK_TIMEOUT_MS,
    );
  });
  try {
    await Promise.race([Promise.resolve().then(work), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function runCheck(
  check: PlannedCheck,
  modules: Record<string, Module>,
  paths: Record<string, string>,
): Promise<CheckResult> {
  Math.random = seededRandom(RANDOM_SEED);
  try {
    if (check.kind === "order") {
      return await runOrder(check, paths);
    }
    const target = modules[check.target];
    if (check.kind === "check") {
      const fn = checkGroup(modules.proof, check.group)[check.key] as Check;
      await withTimeout(() => fn(target));
    } else {
      const tests = testFunctions(modules[check.suite] ?? {});
      if (tests.length === 0) {
        throw new Error(`${check.suite} exports no test functions`);
      }
      for (const [name, test] of tests) {
        try {
          await withTimeout(() => test(target));
        } catch (error) {
          throw new Error(`${name}: ${errorText(error)}`);
        }
      }
    }
    return { id: check.id, passed: true, error: null };
  } catch (error) {
    return { id: check.id, passed: false, error: errorText(error) };
  }
}

let copies = 0;

/** A separate instance of a module, with its own module-level state. */
function freshCopy(path: string): Promise<Module> {
  copies += 1;
  return import(`${pathToFileURL(path).href}?copy=${copies}`);
}

/**
 * Runs every test of the suite in the check's order, going on after a
 * failure, and reports which tests failed and which data they shared.
 */
async function runOrder(
  check: OrderCheck,
  paths: Record<string, string>,
): Promise<CheckResult> {
  const suitePath = paths[check.suite]!;
  const freshTarget = async () =>
    watchInputs(await freshCopy(paths[check.target]!));
  let suite = await freshCopy(suitePath);
  const declared = fileOrder(
    testFunctions(suite).map(([name]) => name),
    await readFile(suitePath, "utf8"),
  );
  if (declared.length === 0) {
    throw new Error(`${check.suite} exports no test functions`);
  }
  const names =
    check.order === "alphabetical"
      ? [...declared].sort()
      : check.order === "reverse"
        ? [...declared].reverse()
        : declared;
  let target = await freshTarget();
  const failedTests: string[] = [];
  let error: string | null = null;
  for (const [index, name] of names.entries()) {
    if (check.order === "alone" && index > 0) {
      suite = await freshCopy(suitePath);
      target = await freshTarget();
    }
    target.startTest(name);
    Math.random = seededRandom(RANDOM_SEED);
    try {
      await withTimeout(() => (suite[name] as Check)(target.module));
    } catch (failure) {
      failedTests.push(name);
      error ??= `${name}: ${errorText(failure)}`;
    }
  }
  return {
    id: check.id,
    passed: failedTests.length === 0,
    error,
    failedTests,
    sharedInputs: target.shared,
  };
}

/**
 * The test names in the order the file declares them. A module lists its
 * exports sorted by name, so the order is read from the source.
 */
function fileOrder(names: string[], source: string): string[] {
  const position = (name: string) => {
    const declaration = new RegExp(
      String.raw`\b(?:function|const|let|var)\s+${name.replaceAll("$", "\\$")}\b`,
    );
    const index = source.search(declaration);
    if (index === -1) {
      throw new Error(`cannot find where ${name} is declared`);
    }
    return index;
  };
  return names
    .map((name) => ({ name, at: position(name) }))
    .sort((a, b) => a.at - b.at)
    .map(({ name }) => name);
}

let text = "";
for await (const chunk of process.stdin) {
  text += chunk;
}
const plan = JSON.parse(text) as RunPlan;

const modules: Record<string, Module> = {};
try {
  for (const [name, path] of Object.entries(plan.modules)) {
    try {
      modules[name] = await import(pathToFileURL(path).href);
    } catch (error) {
      throw new Error(`${name}: ${errorText(error)}`);
    }
  }
  const proofKeys = Object.keys(checkGroup(modules.proof, "proofs"));
  const optionKeys = Object.keys(checkGroup(modules.proof, "options"));
  const results: CheckResult[] = [];
  for (const check of plan.checks) {
    results.push(await runCheck(check, modules, plan.modules));
  }
  emit({ proofKeys, optionKeys, results });
} catch (error) {
  emit({ loadError: errorText(error) });
}
