// How the proof gate talks to a language runner. The gate sends a run plan as
// JSON on stdin; the runner loads the modules, runs the checks and prints one
// "PROOF_RESULT {json}" line. Runners only report what happened; the gate
// decides what should have happened. Both runners follow this file:
// scripts/runners/run-js.ts and scripts/runners/run_python.py.
//
// Test functions: in TypeScript and JavaScript every exported function whose
// name starts with "test", in Python every function named "test_…". A test
// takes the implementation module as its only argument.

export const RESULT_MARKER = "PROOF_RESULT ";
export const CHECK_TIMEOUT_MS = 5_000;
/** Runners reseed the language's random generator with this before each check. */
export const RANDOM_SEED = 20261010;
/**
 * Runners report their UTC offset at this instant (2026-01-15T00:00:00Z), so
 * the gate can see that the time zone it set was really applied. No gate time
 * zone is on daylight saving time then.
 */
export const OFFSET_PROBE_SECONDS = 1_768_435_200;

export interface RunPlan {
  /** Module name -> file path. The proof file is always named "proof". */
  modules: Record<string, string>;
  checks: PlannedCheck[];
}

export type PlannedCheck =
  /** Calls proofs[key] or options[key] of the proof module with the target module. */
  | {
      id: string;
      kind: "check";
      group: "proofs" | "options";
      key: string;
      target: string;
    }
  /** Calls every test function of the suite module with the target module. */
  | { id: string; kind: "suite"; suite: string; target: string }
  /**
   * Testing topic's order check (scripts/lib/test-order.ts): runs every test
   * function of a fresh copy of the suite module, in this order, against a
   * fresh copy of the target, goes on after a failure, and records the data
   * the tests hand to the target.
   */
  | {
      id: string;
      kind: "order";
      suite: string;
      target: string;
      order: TestOrder;
    };

/**
 * file: the order the file declares the tests in; alphabetical: by name;
 * reverse: the file order backwards; alone: each test in its own fresh copy.
 */
export type TestOrder = "file" | "alphabetical" | "reverse" | "alone";

/** A value that two tests of one test file both handed to the target. */
export interface SharedInput {
  /** TypeScript and JavaScript: array, Date, object, Map, Set; Python: list, dict, set. */
  kind: string;
  /** The test that handed it over first, then the other one. */
  tests: [string, string];
  /** The target's function that received it. */
  receiver: string;
}

export interface CheckResult {
  id: string;
  passed: boolean;
  /** First line of the failure, or null when the check passed. */
  error: string | null;
  /** Order checks only: the tests that failed, in the order they ran. */
  failedTests?: string[];
  /** Order checks only. */
  sharedInputs?: SharedInput[];
}

export type RunnerOutput = (
  | { loadError: string }
  | { proofKeys: string[]; optionKeys: string[]; results: CheckResult[] }
) & {
  /** Local time minus UTC at OFFSET_PROBE_SECONDS, in minutes. */
  utcOffsetMinutes: number;
};
