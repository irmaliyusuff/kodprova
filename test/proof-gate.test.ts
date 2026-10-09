import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, test } from "node:test";
import { findPython } from "../scripts/lib/python.ts";
import {
  copyQuestions,
  editFile,
  FIXTURE_QUESTIONS,
  REAL_QUESTIONS,
  runScript,
} from "./helpers.ts";

const GATE = "scripts/proof-gate.ts";

function gate(dir: string, ...args: string[]) {
  const run = runScript(GATE, ["--dir", dir, ...args]);
  return { ...run, output: run.stdout + run.stderr };
}

async function brokenFixture(
  file: string,
  find: string,
  replace: string,
): Promise<string> {
  const dir = await copyQuestions(FIXTURE_QUESTIONS);
  await editFile(join(dir, "age-check", file), find, replace);
  return dir;
}

describe("proof gate", () => {
  test("passes a question whose proofs and options behave as declared", () => {
    const run = gate(FIXTURE_QUESTIONS);
    assert.equal(run.status, 0, run.output);
    assert.match(
      run.output,
      /bug "upper-bound": fails on original, passes on fixed/,
    );
    assert.match(
      run.output,
      /option b \(correct\): fails on original, passes on fixed/,
    );
    assert.match(run.output, /Gate: PASSED/);
  });

  test("fails when the fix for one bug is undone", async () => {
    const dir = await brokenFixture(
      "fixed.ts",
      "age <= MAX_AGE",
      "age < MAX_AGE",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /bug "upper-bound": should pass on fixed code but failed/,
    );
    assert.match(
      run.output,
      /bug "partial-parse": fails on original, passes on fixed/,
    );
    assert.match(run.output, /Gate: FAILED/);
  });

  test("fails when a real question's fix is undone", async () => {
    const dir = await copyQuestions(REAL_QUESTIONS, ["api-event-retry"]);
    await editFile(
      join(dir, "api-event-retry", "fixed.ts"),
      "item.attempts >= MAX_ATTEMPTS",
      "item.attempts > MAX_ATTEMPTS",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /bug "attempt-limit": should pass on fixed code but failed/,
    );
  });

  test("fails when a proof does not fail on the original code", async () => {
    const dir = await brokenFixture(
      "proof.ts",
      "isValidAge(65), true",
      "isValidAge(40), true",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /bug "upper-bound": should fail on original code but passed/,
    );
  });

  test("fails when a wrong option also catches a bug", async () => {
    const dir = await brokenFixture(
      "proof.ts",
      "isValidAge(30), true",
      "isValidAge(65), true",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /option a: should pass on original code but failed/,
    );
  });

  test("fails when the correct option catches nothing", async () => {
    const dir = await brokenFixture(
      "proof.ts",
      'b: (code) => assert.equal(code.isValidAge("30abc"), false)',
      'b: (code) => assert.equal(code.isValidAge("30"), true)',
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /option b \(correct\): should fail on original code but passed/,
    );
  });

  test("fails when a bug has no proof", async () => {
    const dir = await brokenFixture(
      "proof.ts",
      '"upper-bound": (code)',
      '"upper-limit": (code)',
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(run.output, /no proof for bug "upper-bound"/);
    assert.match(run.output, /proof "upper-limit" does not match any bug/);
  });

  test("fails when the code does not load", async () => {
    const dir = await brokenFixture(
      "fixed.ts",
      "const MAX_AGE = 65;",
      "const MAX_AGE = ;",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(run.output, /could not load the code or proof file/);
  });

  test("fails, and says why, when Python is missing", () => {
    const run = runScript(GATE, ["--only", "security-upload-path"], {
      ...process.env,
      PYTHON: join(REAL_QUESTIONS, "no-such-python"),
    });
    assert.equal(run.status, 1);
    assert.match(run.stdout, /Python 3\.10\+ not found/);
    assert.match(run.stdout, /Gate: FAILED/);
  });

  const noPython = findPython().python
    ? false
    : "Python 3.10+ is not installed on this machine";

  test("proves the Python questions", { skip: noPython }, () => {
    const run = runScript(GATE, ["--lang", "python"]);
    assert.equal(run.status, 0, run.stdout + run.stderr);
  });

  test(
    "fails when a Python question's fix is undone",
    { skip: noPython },
    async () => {
      const dir = await copyQuestions(REAL_QUESTIONS, ["security-upload-path"]);
      await editFile(
        join(dir, "security-upload-path", "fixed.py"),
        "startswith(root + os.sep)",
        "startswith(root.rstrip(os.sep))",
      );
      const run = gate(dir);
      assert.equal(run.status, 1);
      assert.match(
        run.output,
        /bug "sibling-prefix": should pass on fixed code but failed/,
      );
    },
  );

  test("fails when a result depends on the time zone", async () => {
    const dir = await brokenFixture(
      "proof.ts",
      "a: (code) => assert.equal(code.isValidAge(30), true)",
      "a: () => assert.equal(new Date(0).getHours(), 0)",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /results change between runs: check \d+ passes with TZ=UTC but fails with TZ=/,
    );
  });
});

describe("proof gate, testing topic", () => {
  const ID = "testing-discount";

  async function brokenTestingFixture(
    file: string,
    find: string,
    replace: string,
  ): Promise<string> {
    const dir = await copyQuestions(FIXTURE_QUESTIONS, [ID]);
    await editFile(join(dir, ID, file), find, replace);
    return dir;
  }

  test("passes when the original test misses the flaw and the fixed test catches it", () => {
    const run = gate(FIXTURE_QUESTIONS, "--only", ID);
    assert.equal(run.status, 0, run.output);
    assert.match(
      run.output,
      /bug "weak-assertion": original test misses flawed-weak-assertion, fixed test catches it, both pass on subject/,
    );
  });

  test("fails when the original test already catches the flaw", async () => {
    const dir = await brokenTestingFixture(
      "original.ts",
      "assert.ok(result <= 200);",
      "assert.ok(result < 200);",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /original test should pass on flawed-weak-assertion \(miss the bug\) but failed/,
    );
  });

  test("fails when the fixed test still misses the flaw", async () => {
    const dir = await brokenTestingFixture(
      "fixed.ts",
      "assert.equal(applyDiscount(200, 10), 180);",
      "assert.ok(applyDiscount(200, 10) <= 200);",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /fixed test should fail on flawed-weak-assertion but passed/,
    );
  });

  test("fails when the fixed test rejects the correct implementation", async () => {
    const dir = await brokenTestingFixture(
      "fixed.ts",
      "assert.equal(applyDiscount(200, 10), 180);",
      "assert.equal(applyDiscount(200, 10), 190);",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(run.output, /fixed test should pass on subject but failed/);
  });

  test("fails when a wrong option catches the flaw", async () => {
    const dir = await brokenTestingFixture(
      "proof.ts",
      "a: (code) => assert.equal(code.applyDiscount(200, 0), 200)",
      "a: (code) => assert.equal(code.applyDiscount(100, 50), 50)",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /option a: should pass on flawed-weak-assertion but failed/,
    );
  });
});
