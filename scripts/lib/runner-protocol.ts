// How the proof gate talks to a language runner. The gate sends a run plan as
// JSON on stdin; the runner loads the modules, runs the checks and prints one
// "PROOF_RESULT {json}" line. Runners only report what happened; the gate
// decides what should have happened. Both runners follow this file:
// scripts/runners/run-js.ts and scripts/runners/run_python.py.

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
  | { id: string; kind: "suite"; suite: string; target: string };

export interface CheckResult {
  id: string;
  passed: boolean;
  /** First line of the failure, or null when the check passed. */
  error: string | null;
}

export type RunnerOutput = (
  | { loadError: string }
  | { proofKeys: string[]; optionKeys: string[]; results: CheckResult[] }
) & {
  /** Local time minus UTC at OFFSET_PROBE_SECONDS, in minutes. */
  utcOffsetMinutes: number;
};
