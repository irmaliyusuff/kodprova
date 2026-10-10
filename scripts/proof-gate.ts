// npm run proof [-- --lang ts,js,python --only <question id> --dir questions]
// The proof gate: validates every question (with --only, just that one), then
// proves each one by running its checks against its code (TypeScript/JavaScript
// in Node, Python through uv or PYTHON). The rules are in scripts/lib/gate.ts.
//
// Every question runs once per time zone in TIME_ZONES, and all runs must
// agree, so a proof that depends on the clock, the time zone or randomness
// fails here rather than on someone else's machine. Exits with 1 if any
// question is not proven.

import { spawn } from "node:child_process";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { buildPlan, evaluate, type GateLine } from "./lib/gate.ts";
import { loadQuestions, type LoadedQuestion } from "./lib/load.ts";
import { findPython, MIN_PYTHON, type PythonSearch } from "./lib/python.ts";
import { LANGUAGES, type Language } from "./lib/question.ts";
import {
  RESULT_MARKER,
  type RunnerOutput,
  type RunPlan,
} from "./lib/runner-protocol.ts";

const TIME_ZONES = [
  "UTC",
  "Europe/Istanbul",
  "America/Los_Angeles",
  "Asia/Kolkata",
  "Pacific/Kiritimati",
];
const RUN_TIMEOUT_MS = 60_000;
const RUNNERS_DIR = join(import.meta.dirname, "runners");

const { values } = parseArgs({
  options: {
    dir: { type: "string", default: "questions" },
    lang: { type: "string" },
    only: { type: "string" },
  },
});

const languages = values.lang
  ? values.lang.split(",").map((item) => item.trim())
  : [...LANGUAGES];
const unknown = languages.filter(
  (item) => !LANGUAGES.includes(item as Language),
);
if (unknown.length > 0) {
  console.error(
    `Unknown --lang value(s): ${unknown.join(", ")}. Use ${LANGUAGES.join(", ")}.`,
  );
  process.exit(1);
}

// With --only, only that folder is validated: other authors' unfinished
// folders do not block the check of a single question.
const { questions, errors } = await loadQuestions(values.dir, values.only);
if (errors.length > 0) {
  console.error(
    `Proof gate stopped: ${errors.length} problem(s) in the question files.\n`,
  );
  for (const error of errors) {
    console.error(`  ✖ ${error}`);
  }
  process.exit(1);
}

const selected = questions.filter(
  ({ question }) =>
    languages.includes(question.language) &&
    (!values.only || question.id === values.only),
);
if (selected.length === 0) {
  console.error("Proof gate: no questions matched.");
  process.exit(1);
}

const filtered =
  values.only !== undefined || selected.length !== questions.length;
const filterNote =
  values.only !== undefined
    ? "; filtered with --only, other folders not validated or checked"
    : filtered
      ? `; filtered, ${questions.length - selected.length} not checked`
      : "";
console.log(
  `Proof gate: ${selected.length} question(s), ${TIME_ZONES.length} runs each` +
    ` (time zones ${TIME_ZONES.join(", ")})${filterNote}`,
);

let python: PythonSearch | undefined;
let passed = 0;
for (const loaded of selected) {
  const { id, language, topic } = loaded.question;
  const lines = await proveQuestion(loaded);
  const ok = lines.length > 0 && lines.every((line) => line.ok);
  if (ok) {
    passed += 1;
  }
  console.log(`\n${ok ? "✔" : "✖"} ${id} (${language}, ${topic})`);
  for (const line of lines) {
    console.log(`    ${line.ok ? "✔" : "✖"} ${line.text}`);
  }
}

const allPassed = passed === selected.length;
console.log(
  `\n${passed} of ${selected.length} question(s) proven. ` +
    `Gate: ${allPassed ? "PASSED" : "FAILED"}` +
    (filtered && allPassed ? " (for the filtered questions only)" : ""),
);
process.exit(allPassed ? 0 : 1);

async function proveQuestion(loaded: LoadedQuestion): Promise<GateLine[]> {
  const { question } = loaded;
  let command: string;
  let args: string[];
  if (question.language === "python") {
    python ??= findPython();
    if (!python.python) {
      return [
        {
          ok: false,
          text:
            `Python ${MIN_PYTHON}+ not found (tried: ${python.tried.join("; ")}). ` +
            "Install uv (https://docs.astral.sh/uv/) and a Python with " +
            "`uv python install`, or set PYTHON to a Python path. " +
            "To check only the other questions: npm run proof -- --lang ts,js",
        },
      ];
    }
    command = python.python.command;
    args = [
      ...python.python.args,
      "-I",
      "-B",
      join(RUNNERS_DIR, "run_python.py"),
    ];
  } else {
    command = process.execPath;
    args = [join(RUNNERS_DIR, "run-js.ts")];
  }

  const gatePlan = buildPlan(loaded);
  const runs = await Promise.all(
    TIME_ZONES.map((zone) => runOnce(command, args, gatePlan.plan, zone)),
  );
  const failure = runs.find((run) => "problem" in run);
  if (failure && "problem" in failure) {
    return [{ ok: false, text: failure.problem }];
  }
  const outputs = runs as Array<{ zone: string; output: RunnerOutput }>;
  const changed = findChange(outputs);
  if (changed) {
    return [{ ok: false, text: changed }];
  }
  return evaluate(question, gatePlan, outputs[0]!.output);
}

/** Describes the first check whose result differs between runs, if any. */
function findChange(
  outputs: Array<{ zone: string; output: RunnerOutput }>,
): string | null {
  const [first, ...rest] = outputs;
  if (!first) {
    return null;
  }
  const outcome = (output: RunnerOutput, id: string) =>
    "loadError" in output
      ? "load error"
      : output.results.find((result) => result.id === id)?.passed
        ? "passes"
        : "fails";
  const ids =
    "loadError" in first.output
      ? []
      : first.output.results.map((result) => result.id);
  for (const other of rest) {
    if ("loadError" in first.output !== "loadError" in other.output) {
      return `results change between runs: loading differs with TZ=${other.zone}`;
    }
    for (const id of ids) {
      const before = outcome(first.output, id);
      const after = outcome(other.output, id);
      if (before !== after) {
        return (
          `results change between runs: check ${id} ${before} with TZ=${first.zone} ` +
          `but ${after} with TZ=${other.zone}. Fix the clock, time zone and ` +
          "random values in the code under test (pass them in) and in the proof"
        );
      }
    }
  }
  return null;
}

async function runOnce(
  command: string,
  args: string[],
  plan: RunPlan,
  zone: string,
): Promise<{ zone: string; output: RunnerOutput } | { problem: string }> {
  const run = await runProcess(command, args, JSON.stringify(plan), {
    ...process.env,
    TZ: zone,
  });
  if (run.timedOut) {
    return { problem: `stopped after ${RUN_TIMEOUT_MS} ms (endless loop?)` };
  }
  const resultLine = run.stdout
    .split(/\r?\n/)
    .reverse()
    .find((line) => line.startsWith(RESULT_MARKER));
  if (!resultLine) {
    const detail = run.stderr.trim().split(/\r?\n/).slice(-3).join(" | ");
    return { problem: `runner gave no result (exit ${run.code}): ${detail}` };
  }
  return {
    zone,
    output: JSON.parse(resultLine.slice(RESULT_MARKER.length)) as RunnerOutput,
  };
}

interface ProcessResult {
  stdout: string;
  stderr: string;
  code: number | null;
  timedOut: boolean;
}

function runProcess(
  command: string,
  args: string[],
  input: string,
  env: NodeJS.ProcessEnv,
): Promise<ProcessResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { env });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.stdin.on("error", () => {
      // The runner may exit before reading its input; its output says why.
    });
    child.stdin.end(input);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, RUN_TIMEOUT_MS);
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: `${stderr}${error.message}`,
        code: null,
        timedOut,
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, timedOut });
    });
  });
}
