// The rules of the proof gate (PRD K17, §7.3). For each question it builds a
// run plan (which checks to run against which code) together with the claims
// the results must support, then judges a runner's output against them.
//
// Implementation topics (web, api, security): the question code is an
// implementation.
//   - Each bug's proof fails on the original code and passes on the fixed code.
//   - The correct test option does the same; every other option passes on both.
// Testing topic: the question code is a test, and a bad test passes anyway.
//   - For each bug, the original test passes on flawed-<bug> (it misses the
//     bug) and the fixed test fails on it (it catches the bug).
//   - Both tests pass on the correct implementation (subject).
//   - The correct option fails on flawed-<its bug> and passes on subject; every
//     other option passes on subject and on every flawed implementation.
//   - Every test of both files gives the same result whatever order the tests
//     run in, and no two tests hand the implementation the same data (see
//     test-order.ts).

import { codePath, type LoadedQuestion } from "./load.ts";
import { TESTING_TOPIC, type Question } from "./question.ts";
import type {
  CheckResult,
  PlannedCheck,
  RunnerOutput,
  RunPlan,
} from "./runner-protocol.ts";
import { judgeOrder, planOrderClaim, type OrderClaim } from "./test-order.ts";

export interface GateLine {
  ok: boolean;
  text: string;
}

/** A planned check before it gets its id. */
type UnplannedCheck = PlannedCheck extends infer Check
  ? Check extends PlannedCheck
    ? Omit<Check, "id">
    : never
  : never;

interface Expectation {
  check: PlannedCheck;
  pass: boolean;
  /** How a broken expectation reads, e.g. "should fail on original code". */
  describe: string;
}

interface Claim {
  label: string;
  summary: string;
  expectations: Expectation[];
}

export interface GatePlan {
  plan: RunPlan;
  claims: Claim[];
  /** Testing topic only. */
  orderClaims: OrderClaim[];
}

export function buildPlan(loaded: LoadedQuestion): GatePlan {
  const { question, dir, extension } = loaded;
  const modules: Record<string, string> = {};
  const addModule = (name: string) => {
    modules[name] = codePath(dir, name, extension);
    return name;
  };
  addModule("proof");
  const checks: PlannedCheck[] = [];
  const add = <Check extends UnplannedCheck>(check: Check) => {
    const planned = { ...check, id: String(checks.length) };
    checks.push(planned as PlannedCheck);
    return planned;
  };
  const expect = (
    check: UnplannedCheck,
    pass: boolean,
    describe: string,
  ): Expectation => ({ check: add(check) as PlannedCheck, pass, describe });
  const option = (key: string, target: string) =>
    ({ kind: "check", group: "options", key, target }) as const;
  const { correct } = question.testQuestion;
  const claims: Claim[] = [];

  if (question.topic !== TESTING_TOPIC) {
    const original = addModule("original");
    const fixed = addModule("fixed");
    const catchesBug = (check: (target: string) => UnplannedCheck) => [
      expect(check(original), false, "should fail on original code"),
      expect(check(fixed), true, "should pass on fixed code"),
    ];
    for (const bug of question.bugs) {
      claims.push({
        label: `bug "${bug.id}"`,
        summary: "fails on original, passes on fixed",
        expectations: catchesBug((target) => ({
          kind: "check",
          group: "proofs",
          key: bug.id,
          target,
        })),
      });
    }
    for (const { id } of question.testQuestion.options) {
      claims.push(
        id === correct
          ? {
              label: `option ${id} (correct)`,
              summary: "fails on original, passes on fixed",
              expectations: catchesBug((target) => option(id, target)),
            }
          : {
              label: `option ${id}`,
              summary: "passes on original and fixed",
              expectations: [
                expect(
                  option(id, original),
                  true,
                  "should pass on original code",
                ),
                expect(option(id, fixed), true, "should pass on fixed code"),
              ],
            },
      );
    }
    return { plan: { modules, checks }, claims, orderClaims: [] };
  }

  const originalTest = addModule("original");
  const fixedTest = addModule("fixed");
  const subject = addModule("subject");
  const flawed = question.bugs.map((bug) => addModule(`flawed-${bug.id}`));
  const suite = (test: string, target: string) =>
    ({ kind: "suite", suite: test, target }) as const;
  question.bugs.forEach((bug, index) => {
    const target = flawed[index]!;
    claims.push({
      label: `bug "${bug.id}"`,
      summary: `original test misses ${target}, fixed test catches it, both pass on subject`,
      expectations: [
        expect(
          suite(originalTest, target),
          true,
          `original test should pass on ${target} (miss the bug)`,
        ),
        expect(
          suite(fixedTest, target),
          false,
          `fixed test should fail on ${target}`,
        ),
        expect(
          suite(originalTest, subject),
          true,
          "original test should pass on subject",
        ),
        expect(
          suite(fixedTest, subject),
          true,
          "fixed test should pass on subject",
        ),
      ],
    });
  });
  const correctTarget = `flawed-${question.testQuestion.bug}`;
  for (const { id } of question.testQuestion.options) {
    const onSubject = expect(
      option(id, subject),
      true,
      "should pass on subject",
    );
    claims.push(
      id === correct
        ? {
            label: `option ${id} (correct)`,
            summary: `fails on ${correctTarget}, passes on subject`,
            expectations: [
              expect(
                option(id, correctTarget),
                false,
                `should fail on ${correctTarget}`,
              ),
              onSubject,
            ],
          }
        : {
            label: `option ${id}`,
            summary: "passes on subject and every flawed implementation",
            expectations: [
              onSubject,
              ...flawed.map((target) =>
                expect(option(id, target), true, `should pass on ${target}`),
              ),
            ],
          },
    );
  }
  const implementations = [subject, ...flawed];
  const orderClaims = [
    planOrderClaim("original test", originalTest, implementations, add),
    planOrderClaim("fixed test", fixedTest, implementations, add),
  ];
  return { plan: { modules, checks }, claims, orderClaims };
}

export function evaluate(
  question: Question,
  { claims, orderClaims }: GatePlan,
  output: RunnerOutput,
): GateLine[] {
  if ("loadError" in output) {
    return [
      {
        ok: false,
        text: `could not load the code or proof file: ${output.loadError}`,
      },
    ];
  }
  const testing = question.topic === TESTING_TOPIC;
  const bugIds = testing ? [] : question.bugs.map((bug) => bug.id);
  const optionIds = question.testQuestion.options.map((option) => option.id);
  const lines: GateLine[] = [
    ...matchKeys("proof", "bug", bugIds, output.proofKeys, testing),
    ...matchKeys("option check", "option", optionIds, output.optionKeys, false),
  ];
  const results = new Map(output.results.map((result) => [result.id, result]));
  for (const claim of claims) {
    const keyMissing = claim.expectations.some(({ check }) =>
      check.kind === "check"
        ? !(
            check.group === "proofs" ? output.proofKeys : output.optionKeys
          ).includes(check.key)
        : false,
    );
    if (!keyMissing) {
      lines.push(judge(claim, results));
    }
  }
  lines.push(...orderClaims.map((claim) => judgeOrder(claim, results)));
  return lines;
}

function matchKeys(
  what: string,
  owner: string,
  expected: string[],
  actual: string[],
  testing: boolean,
): GateLine[] {
  const lines: GateLine[] = [];
  for (const id of expected.filter((key) => !actual.includes(key))) {
    lines.push({ ok: false, text: `no ${what} for ${owner} "${id}"` });
  }
  for (const id of actual.filter((key) => !expected.includes(key))) {
    lines.push({
      ok: false,
      text: testing
        ? `${what} "${id}": testing questions have no proofs (the tests are the proof)`
        : `${what} "${id}" does not match any ${owner} in question.json`,
    });
  }
  return lines;
}

function judge(claim: Claim, results: Map<string, CheckResult>): GateLine {
  const problems: string[] = [];
  for (const { check, pass, describe } of claim.expectations) {
    const result = results.get(check.id);
    if (!result) {
      problems.push(`${describe} but gave no result`);
    } else if (result.passed !== pass) {
      problems.push(
        result.passed
          ? `${describe} but passed`
          : `${describe} but failed: ${result.error}`,
      );
    }
  }
  return problems.length > 0
    ? { ok: false, text: `${claim.label}: ${problems.join("; ")}` }
    : { ok: true, text: `${claim.label}: ${claim.summary}` };
}
