import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, test } from "node:test";
import { loadQuestions } from "../scripts/lib/load.ts";
import {
  countSentences,
  validateQuestion,
  type QuestionContext,
} from "../scripts/lib/question.ts";
import { FIXTURE_QUESTIONS, REAL_QUESTIONS } from "./helpers.ts";

const CONTEXT: QuestionContext = {
  folderName: "age-check",
  originalLineCount: 17,
  fixedLineCount: 18,
};

async function fixtureJson(): Promise<any> {
  return JSON.parse(
    await readFile(
      join(FIXTURE_QUESTIONS, "age-check", "question.json"),
      "utf8",
    ),
  );
}

/** Validates the fixture after `change`, with an optional context override. */
async function errorsAfter(
  change: (json: any) => void,
  context: Partial<QuestionContext> = {},
): Promise<string[]> {
  const json = await fixtureJson();
  change(json);
  return validateQuestion(json, { ...CONTEXT, ...context }).errors;
}

/** Deletes a field by a path such as "bugs[0].explanation.tr". */
function deleteAt(json: any, path: string): void {
  const keys = path
    .split(/\.|\[(\d+)\]/)
    .filter((key) => key !== undefined && key !== "");
  const last = keys.pop()!;
  const parent = keys.reduce((node, key) => node[key], json);
  delete parent[last];
}

describe("question format", () => {
  test("the fixture and the real questions are valid", async () => {
    const json = await fixtureJson();
    assert.deepEqual(validateQuestion(json, CONTEXT).errors, []);
    for (const dir of [FIXTURE_QUESTIONS, REAL_QUESTIONS]) {
      const { questions, errors } = await loadQuestions(dir);
      assert.deepEqual(errors, []);
      assert.ok(questions.length > 0);
    }
  });

  const requiredPaths = [
    "id",
    "title",
    "title.en",
    "topic",
    "difficulty",
    "language",
    "origin",
    "task",
    "task.tr",
    "deliveryNote",
    "deliveryNote.en",
    "bugs",
    "bugs[0].id",
    "bugs[0].lines",
    "bugs[0].fixedLines",
    "bugs[0].severity",
    "bugs[1].explanation",
    "bugs[1].explanation.tr",
    "testQuestion",
    "testQuestion.bug",
    "testQuestion.correct",
    "testQuestion.options[1].text",
    "sampleAnswer",
    "sampleAnswer.en",
    "checklist[0].tr",
  ];
  for (const path of requiredPaths) {
    test(`a missing "${path}" is named`, async () => {
      const errors = await errorsAfter((json) => deleteAt(json, path));
      assert.ok(
        errors.includes(`missing field "${path}"`),
        `expected missing field "${path}", got:\n${errors.join("\n")}`,
      );
    });
  }

  test("an unknown field is named, so typos do not go unnoticed", async () => {
    const errors = await errorsAfter((json) => {
      json.deliverNote = json.deliveryNote;
    });
    assert.deepEqual(errors, ['unknown field "deliverNote"']);
  });

  test("question.json has no internal field: sources are kept outside the repository", async () => {
    const errors = await errorsAfter((json) => {
      json.internal = { source: "somewhere" };
    });
    assert.deepEqual(errors, ['unknown field "internal"']);
  });

  test("the testing topic requires a flawed implementation for each bug", async () => {
    const errors = await errorsAfter((json) => {
      json.topic = "testing";
    });
    assert.deepEqual(errors, [
      'missing field "bugs[0].flawedImplementation"',
      'missing field "bugs[1].flawedImplementation"',
    ]);
  });

  test("other topics do not take a flawed implementation", async () => {
    const errors = await errorsAfter((json) => {
      json.bugs[0].flawedImplementation = { tr: "x", en: "x" };
    });
    assert.deepEqual(errors, ['unknown field "bugs[0].flawedImplementation"']);
  });

  const invalidCases: Array<[string, (json: any) => void, string]> = [
    [
      "difficulty out of range",
      (j) => (j.difficulty = 6),
      '"difficulty" must be a whole number',
    ],
    [
      "unknown topic",
      (j) => (j.topic = "frontend"),
      '"topic" must be one of: web, api',
    ],
    [
      "unknown severity",
      (j) => (j.bugs[0].severity = "high"),
      '"bugs[0].severity" must be one of',
    ],
    [
      "unknown origin",
      (j) => (j.origin = "real-ish"),
      '"origin" must be one of: real, fictional',
    ],
    [
      "empty text",
      (j) => (j.task.en = "  "),
      '"task.en" must be a non-empty string',
    ],
    [
      "line 0",
      (j) => (j.bugs[0].lines = [0, 1]),
      '"bugs[0].lines[0]" must be a whole number',
    ],
    [
      "line past the end",
      (j) => (j.bugs[0].lines = [3, 18]),
      '"bugs[0].lines[1]" must be',
    ],
    [
      "fixed line past the end",
      (j) => (j.bugs[0].fixedLines = [19, 19]),
      '"bugs[0].fixedLines[0]"',
    ],
    [
      "range backwards",
      (j) => (j.bugs[0].lines = [4, 3]),
      '"bugs[0].lines" must start before',
    ],
    [
      "overlapping ranges",
      (j) => (j.bugs[1].lines = [5, 9]),
      '"bugs" line ranges must not overlap',
    ],
    [
      "three bugs",
      (j) => j.bugs.push(j.bugs[0]),
      '"bugs" must have 1 to 2 items (has 3)',
    ],
    ["no bugs", (j) => (j.bugs = []), '"bugs" must have 1 to 2 items (has 0)'],
    [
      "two options",
      (j) => j.testQuestion.options.splice(2),
      "must have 3 to 4 items (has 2)",
    ],
    [
      "options out of order",
      (j) => (j.testQuestion.options[0].id = "b"),
      'must be "a"',
    ],
    [
      "unknown correct option",
      (j) => (j.testQuestion.correct = "e"),
      '"testQuestion.correct"',
    ],
    [
      "test for unknown bug",
      (j) => (j.testQuestion.bug = "nope"),
      '"testQuestion.bug" must name',
    ],
    [
      "one-sentence answer",
      (j) => (j.sampleAnswer.en = "Too short."),
      "must be 2 to 4 sentences",
    ],
    [
      "one checklist item",
      (j) => j.checklist.splice(1),
      '"checklist" must have 2 to 4 items',
    ],
    [
      "id is not a slug",
      (j) => (j.id = "Age Check"),
      '"id" must be lowercase words',
    ],
  ];
  for (const [name, change, expected] of invalidCases) {
    test(`rejects ${name}`, async () => {
      const errors = await errorsAfter(change);
      assert.ok(
        errors.some((error) => error.includes(expected)),
        `expected an error containing ${expected}, got:\n${errors.join("\n")}`,
      );
    });
  }

  test("the id must match the folder name", async () => {
    const errors = await errorsAfter(() => {}, { folderName: "age-check-2" });
    assert.deepEqual(errors, ['"id" must match the folder name "age-check-2"']);
  });

  test("the original code must be 15 to 60 lines", async () => {
    const short = await errorsAfter(() => {}, { originalLineCount: 14 });
    const long = await errorsAfter(() => {}, { originalLineCount: 61 });
    assert.ok(
      short.includes("original code must have 15 to 60 lines (has 14)"),
    );
    assert.ok(long.some((error) => error.includes("(has 61)")));
  });
});

describe("countSentences", () => {
  test("counts sentence ends followed by a space or the end", () => {
    assert.equal(countSentences("One. Two! Three?"), 3);
    assert.equal(countSentences("It reads a.txt and res.ok, then stops."), 1);
    assert.equal(countSentences("Ends with an ellipsis… Then more."), 2);
    assert.equal(countSentences("  "), 0);
  });
});
