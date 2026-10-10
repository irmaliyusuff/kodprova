# Kodprova

Practice finding the hidden bugs in AI-written code, and explaining them the way an interviewer
expects: how severe the bug is, why, and which test proves it. Turkish and English.

> **Status: early.** This repository holds the question format, the format checker and the proof
> gate. The site itself (React + TypeScript + Vite) comes next.

## How it works

Each question shows three things: the **task** an AI assistant was given, the **code** it wrote
(15–60 lines) and its confident **handoff note**. The code hides one or two bugs. You mark the
lines you think are wrong, pick a severity for each mark, write one sentence on why, and choose
the test that would catch the bug. Then you see what you found, what you missed, the fixed code
and a sample interview answer.

Every question is checked by a **proof gate** before it can ship: each bug is shown by a test that
fails where the bug is and passes where it is fixed.

## Requirements

- Node.js 24 or newer (runs the TypeScript scripts directly, no build step)
- For the Python questions: [uv](https://docs.astral.sh/uv/) with Python 3.10 or newer
  (`uv python install`). The gate runs `uv run --no-project python` and never downloads Python
  itself. Without uv, set `PYTHON` to the path of a Python 3.10+ interpreter.

```sh
npm install
```

## Commands

| Command                   | What it does                                                                |
| ------------------------- | --------------------------------------------------------------------------- |
| `npm run proof`           | Proof gate: validates every question, then proves every question            |
| `npm run build:questions` | Validates every question and writes `generated/questions.json` for the site |
| `npm test`                | Tests of the format checker, the build and the proof gate itself            |
| `npm run typecheck`       | `tsc` over scripts, tests and the TypeScript questions                      |
| `npm run format:check`    | Prettier check (`npm run format` to fix)                                    |
| `npm run check`           | All of the above                                                            |
| `npm run scan-names`      | Looks for private names in every file and in the git history (see below)    |

Proof gate options: `-- --lang ts,js` (or `python`) checks only those languages,
`-- --only <question id>` a single question (only that folder is validated, so an unfinished
folder elsewhere does not stop it). A filtered run says so in its result line.

## Adding a question

A question is one folder under `questions/`. The folder name is the question id.

```
questions/
  api-event-retry/
    question.json   texts, bugs, test question, sample answer
    original.ts     the code as the AI wrote it (shown to the user)
    fixed.ts        the same code with every bug fixed
    proof.ts        one proof per bug, one check per test option
```

Python questions use `.py` files. Nothing else changes: the site reads every folder, so adding a
question never touches application code.

**Testing topic.** Here the AI wrote a **test**, and a bad test passes anyway, so it is proven the
other way round. `original` and `fixed` are tests, and two more kinds of file are needed:

```
questions/testing-.../
  original.ts               the test as the AI wrote it
  fixed.ts                  the corrected test
  subject.ts                a correct implementation the tests run against
  flawed-<bug id>.ts        per bug: an implementation the original test lets through
  proof.ts                  test option checks only (no proofs)
```

A test file exports test functions (TypeScript: names starting with `test`; Python: `test_…`)
that take the implementation module as their argument. See
[`test/fixtures/questions/testing-discount`](test/fixtures/questions/testing-discount).

### question.json

Every text is given in both languages: `{ "tr": "…", "en": "…" }`.

| Field          | Meaning                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| `id`           | Same as the folder name; lowercase words joined by hyphens                                   |
| `title`        | Short name for the question list; must not give the bug away                                 |
| `topic`        | `web`, `api`, `security` or `testing`                                                        |
| `difficulty`   | 1 (one bug, about 15–25 lines) to 5 (two or subtle bugs, about 40–60 lines)                  |
| `language`     | `ts`, `js` or `python`                                                                       |
| `origin`       | `real` (the pattern of a bug found in a real project, rewritten from scratch) or `fictional` |
| `task`         | What the AI assistant was asked to do                                                        |
| `deliveryNote` | What the assistant said when it handed the code over                                         |
| `bugs`         | 1–2 bugs, see below                                                                          |
| `testQuestion` | `bug` it is about, 3–4 `options` with ids `a`, `b`, `c`, `d` in order, and `correct`         |
| `sampleAnswer` | A 2–4 sentence interview answer                                                              |
| `checklist`    | 2–4 points the user checks their own answer against                                          |

Each bug has an `id`, `lines` (inclusive 1-based range in the original code; a mark anywhere
inside counts as found), `fixedLines` (the fix in the fixed code), `severity` and `explanation`.
In the testing topic each bug also has `flawedImplementation`: what the implementation that slips
past the test gets wrong. Ranges of two bugs must not overlap. Unknown fields are errors, so a typo
cannot pass silently.

Severity uses one scale: **critical** = data loss, a security hole or lost money; **major** = the user
gets a wrong result; **minor** = an edge case or readability.

There is no field for where a question came from: the repository is public, so that record is kept
outside it. A question that breaks any rule stops the build and the gate, naming the file and the
field:

```
Build stopped: 2 problem(s) in the question files.

  ✖ questions/age-check: missing field "deliveryNote.en"
  ✖ questions/age-check: missing field "bugs[1].severity"
```

### Example

This is the reference example from the product spec. It lives in
[`test/fixtures/questions/age-check`](test/fixtures/questions/age-check) and is never published.

`original.ts` (17 lines, two bugs on lines 5 and 9):

```ts
const MIN_AGE = 18;
const MAX_AGE = 65;

export function isValidAge(input: string | number): boolean {
  const age = parseInt(String(input), 10);
  if (Number.isNaN(age)) {
    return false;
  }
  return age >= MIN_AGE && age < MAX_AGE;
}
// … ageError() follows
```

`question.json`, shortened:

```json
{
  "id": "age-check",
  "topic": "web",
  "difficulty": 1,
  "language": "ts",
  "origin": "fictional",
  "bugs": [
    {
      "id": "partial-parse",
      "lines": [5, 5],
      "fixedLines": [5, 9],
      "severity": "major",
      "explanation": {
        "tr": "…",
        "en": "`parseInt` reads the leading digits and drops the rest…"
      }
    },
    {
      "id": "upper-bound",
      "lines": [9, 9],
      "fixedLines": [10, 10],
      "severity": "major",
      "explanation": {
        "tr": "…",
        "en": "`age < MAX_AGE` leaves the upper limit out…"
      }
    }
  ],
  "testQuestion": {
    "bug": "partial-parse",
    "options": [
      {
        "id": "a",
        "text": {
          "tr": "`isValidAge(30) === true`",
          "en": "`isValidAge(30) === true`"
        }
      },
      {
        "id": "b",
        "text": { "tr": "`isValidAge(\"30abc\") === false`", "en": "…" }
      },
      { "id": "c", "text": { "tr": "`isValidAge(-1) === false`", "en": "…" } },
      {
        "id": "d",
        "text": { "tr": "`isValidAge(\"40\") === true`", "en": "…" }
      }
    ],
    "correct": "b"
  }
}
```

`proof.ts`: every check gets the question's module, original or fixed, and fails by throwing.

```ts
import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

export default {
  proofs: {
    "upper-bound": (code) => assert.equal(code.isValidAge(65), true),
    "partial-parse": (code) => assert.equal(code.isValidAge("30abc"), false),
  },
  options: {
    a: (code) => assert.equal(code.isValidAge(30), true),
    b: (code) => assert.equal(code.isValidAge("30abc"), false),
    c: (code) => assert.equal(code.isValidAge(-1), false),
    d: (code) => assert.equal(code.isValidAge("40"), true),
  },
} satisfies ProofSuite<typeof Code>;
```

In Python, `proof.py` defines two dicts of functions that take the module:
`PROOFS = {"<bug id>": check}` and `OPTIONS = {"a": check, …}`; a check fails by raising
(a plain `assert` is enough). See [`questions/security-upload-path`](questions/security-upload-path).

### What the proof gate checks

Web, API and security topics (the question code is an implementation):

1. Each bug has a proof that **fails on the original** and **passes on the fixed** code.
2. The correct test option does the same.
3. Every other option **passes on both**, so only one option catches a bug.

Testing topic (the question code is a test):

1. For each bug, the **original test passes** on `flawed-<bug id>` (it misses the bug) and the
   **fixed test fails** on it (it catches the bug).
2. Both tests pass on `subject`, the correct implementation.
3. The correct option fails on the flawed implementation of its bug and passes on `subject`;
   every other option passes on `subject` and on every flawed implementation.

For both: proof and option ids match `question.json` exactly, and every question is run in five
time zones (UTC, Istanbul, Los Angeles, Kolkata, Kiritimati) whose results must agree. Code that
does not load, a check that hangs, results that change between runs or a missing Python
interpreter all count as a failure.

### Writing rules

- Code uses English names, so one code listing serves both languages.
- Original and fixed code: 15–60 lines, at most 80 characters per line, LF line endings.
  TypeScript questions are Prettier-formatted (`npm run format`) **before** you count line numbers.
- TypeScript questions run without a build step, so use erasable syntax only (no `enum`,
  `namespace` or constructor parameter properties).
- Export functions or factories; avoid module-level state, since the proofs reuse one module.
- Code that depends on the clock or on randomness takes them as parameters (`now`, `random`), and
  proofs pass fixed values. As a safety net the runners reseed `Math.random` / `random` with the
  same seed before every check.
- A sample answer is counted as 2–4 sentences: `.` `!` `?` or `…` followed by a space ends one.
  Punctuation inside inline code (`` `a?` ``, `` `5.` ``) does not, but plain text does: write
  Turkish ordinals as words ("beşinci sayfa", not "5. sayfa") and avoid "e.g.".
- The fixed code should change only what the bugs need. Anything else a careful reviewer could
  show to be a real bug, with a concrete input (wrong result for the task, security, data or
  money), is a bug in the question. Readability issues may stay.
- `real` questions carry the **pattern** of a real bug. Never copy the original code, and never
  name the client, the project, a person or an internal reference in any file or commit message.

## Private names scan

```sh
PRIVATE_NAMES_FILE=/path/outside/the/repo/names.txt npm run scan-names
```

The list is kept **outside** the repository (publishing it would be the leak it guards against);
the scan refuses a list inside it. One entry per line: plain text matches ignoring case and Turkish
letters, `re:<regex>` matches a pattern, `#` starts a comment. It searches every file git would
commit, `generated/questions.json` and the whole git history: every commit message and every diff,
so a name that was added and later removed is still found. Run it before every commit that adds a
`real` question.

## License

[MIT](LICENSE), for the code and the questions.
