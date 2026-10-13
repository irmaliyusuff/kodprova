import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { describe, test } from "node:test";
import { findPython } from "../scripts/lib/python.ts";
import {
  TIME_ZONES,
  tzValue,
  zonesNotApplied,
} from "../scripts/lib/time-zones.ts";
import {
  copyQuestions,
  editFile,
  FIXTURE_QUESTIONS,
  PYTHON_TESTING_QUESTIONS,
  REAL_QUESTIONS,
  runScript,
  SHARED_DATA_QUESTIONS,
} from "./helpers.ts";

const GATE = "scripts/proof-gate.ts";

const noPython = findPython().python
  ? false
  : "Python 3.10+ is not installed on this machine";

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

  test("proves the Python questions", { skip: noPython }, () => {
    const run = runScript(GATE, ["--lang", "python"]);
    assert.equal(run.status, 0, run.stdout + run.stderr);
    // Python got every time zone (on Windows through the C runtime form).
    assert.doesNotMatch(run.stdout, /SKIPPED/);
  });

  test(
    "fails when a Python result depends on the time zone",
    { skip: noPython },
    async () => {
      const dir = await copyQuestions(REAL_QUESTIONS, ["security-upload-path"]);
      await editFile(
        join(dir, "security-upload-path", "proof.py"),
        "def option_a(code):\n",
        'def option_a(code):\n    assert __import__("time").localtime(0).tm_hour == 0\n',
      );
      const run = gate(dir);
      assert.equal(run.status, 1, run.output);
      assert.match(
        run.output,
        /results change between runs: check \d+ passes with TZ=UTC but fails with TZ=/,
      );
    },
  );

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

describe("proof gate, time zones", () => {
  test("Python on Windows gets the C runtime form, everything else the IANA name", () => {
    const zone = TIME_ZONES.find((item) => item.name === "Asia/Kolkata")!;
    assert.equal(tzValue(zone, "python", "win32"), "IST-5:30");
    assert.equal(tzValue(zone, "python", "linux"), "Asia/Kolkata");
    assert.equal(tzValue(zone, "ts", "win32"), "Asia/Kolkata");
  });

  test("says nothing when every run had its offset", () => {
    const runs = TIME_ZONES.map((zone) => ({
      zone: zone.name,
      utcOffsetMinutes: zone.offsetMinutes,
    }));
    assert.equal(zonesNotApplied(runs), undefined);
  });

  test("says the check was skipped when a run stayed at UTC", () => {
    const runs = TIME_ZONES.map((zone) => ({
      zone: zone.name,
      utcOffsetMinutes: 0,
    }));
    const warning = zonesNotApplied(runs);
    assert.match(warning ?? "", /time-zone check SKIPPED/);
    assert.match(warning ?? "", /Asia\/Kolkata ran at UTC\+0/);
    assert.doesNotMatch(warning ?? "", /UTC ran at/);
  });
});

describe("proof gate, --only", () => {
  /** The fixtures plus an empty folder, like a question still being written. */
  async function withHalfWrittenFolder(): Promise<string> {
    const dir = await copyQuestions(FIXTURE_QUESTIONS);
    await mkdir(join(dir, "half-written"));
    return dir;
  }

  test("a half-written folder stops the full run", async () => {
    const run = gate(await withHalfWrittenFolder());
    assert.equal(run.status, 1);
    assert.match(run.output, /Proof gate stopped: 1 problem\(s\)/);
    assert.match(run.output, /half-written: missing file question\.json/);
  });

  test("validates and proves only the chosen folder", async () => {
    const run = gate(await withHalfWrittenFolder(), "--only", "age-check");
    assert.equal(run.status, 0, run.output);
    assert.doesNotMatch(run.output, /half-written/);
    assert.match(run.output, /1 question\(s\).*filtered with --only/);
    assert.match(
      run.output,
      /Gate: PASSED \(for the filtered questions only\)/,
    );
  });

  test("still validates the chosen folder", async () => {
    const dir = await withHalfWrittenFolder();
    await editFile(
      join(dir, "age-check", "question.json"),
      '"difficulty": 1',
      '"difficulty": 9',
    );
    const run = gate(dir, "--only", "age-check");
    assert.equal(run.status, 1);
    assert.match(run.output, /Proof gate stopped: 1 problem\(s\)/);
    assert.match(run.output, /age-check: .*"difficulty"/);
    assert.doesNotMatch(run.output, /half-written/);
  });

  test("fails when no folder has that id", () => {
    const run = gate(FIXTURE_QUESTIONS, "--only", "no-such-question");
    assert.equal(run.status, 1);
    assert.match(run.output, /no questions matched/);
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
      "assert.equal(result, 180);",
      "assert.ok(result < 201);",
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
      "assert.equal(result, 180);",
      "assert.equal(result, 190);",
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

describe("proof gate, testing topic, test order", () => {
  test("passes tests that do not depend on each other", () => {
    const run = gate(FIXTURE_QUESTIONS, "--only", "testing-discount");
    assert.equal(run.status, 0, run.output);
    for (const file of ["original", "fixed"]) {
      assert.match(
        run.output,
        new RegExp(
          `✔ ${file} test: same result for every test in file, ` +
            "alphabetical and reverse order and alone; no data shared",
        ),
      );
    }
  });

  test("fails when a test's result depends on the tests before it", async () => {
    // testTenPercentOff leaves 180 in `price`; testZeroPercent then expects 200.
    const dir = await copyQuestions(FIXTURE_QUESTIONS, ["testing-discount"]);
    const fixed = join(dir, "testing-discount", "fixed.ts");
    await editFile(
      fixed,
      'from "./subject.ts";\n',
      'from "./subject.ts";\n\nlet price = 200;\n',
    );
    await editFile(
      fixed,
      "const result = applyDiscount(200, 10);",
      "const result = applyDiscount(price, 10);\n  price = result;",
    );
    await editFile(fixed, "applyDiscount(200, 0)", "applyDiscount(price, 0)");
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /✖ fixed test: order-dependent: testZeroPercent passes alone but fails in file and alphabetical order on subject/,
    );
    assert.match(run.output, /✔ original test: same result/);
  });

  test("fails when two tests hand the same array to the implementation", () => {
    // testing-active-users as first written: one module-level USERS list.
    const run = gate(SHARED_DATA_QUESTIONS);
    assert.equal(run.status, 1);
    for (const file of ["original", "fixed"]) {
      assert.match(
        run.output,
        new RegExp(
          `✖ ${file} test: tests share data: testReturnsOnlyActiveUsers and ` +
            "testLeavesInputUnchanged pass the same array and object to activeUsers",
        ),
      );
    }
  });

  test("fails when two tests hand the same Date to the implementation", async () => {
    const dir = await copyQuestions(REAL_QUESTIONS, ["testing-trial-status"]);
    await editFile(
      join(dir, "testing-trial-status", "fixed.ts"),
      "const now = () => new Date(START);",
      "const shared = new Date(START);\nconst now = () => shared;",
    );
    const run = gate(dir);
    assert.equal(run.status, 1);
    assert.match(
      run.output,
      /✖ fixed test: tests share data: testActive and testEndingSoon pass the same Date to trialState/,
    );
  });

  test("checks the order of Python tests too", { skip: noPython }, async () => {
    const passing = gate(PYTHON_TESTING_QUESTIONS);
    assert.equal(passing.status, 0, passing.output);
    assert.match(passing.output, /✔ fixed test: same result/);

    const dir = await copyQuestions(PYTHON_TESTING_QUESTIONS);
    await editFile(
      join(dir, "testing-cart-total", "fixed.py"),
      "def make_prices():\n    return [500, 250, 125]\n",
      "PRICES = [500, 250, 125]\n\n\ndef make_prices():\n    return PRICES\n",
    );
    const sharing = gate(dir);
    assert.equal(sharing.status, 1);
    assert.match(
      sharing.output,
      /✖ fixed test: tests share data: test_several_items and test_leaves_prices_unchanged pass the same list to cart_total/,
    );
  });
});
