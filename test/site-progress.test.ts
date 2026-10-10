import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  emptyProgress,
  parseProgress,
  serializeProgress,
  summarizeProgress,
  type Progress,
} from "../src/lib/progress.ts";
import { firstToStart, nextStep } from "../src/lib/question-order.ts";
import { makeQuestion, makeQuestionList } from "./site-fixtures.ts";

const questions = [makeQuestion()];
const answer = {
  marks: [{ line: 2, severity: "critical" as const, reason: "<img src=x>" }],
  testChoice: "b",
};

describe("stored progress (PRD K12, K13)", () => {
  test("survives a round trip unchanged", () => {
    const progress: Progress = {
      results: { sample: answer },
      checklists: { sample: [true, false] },
    };
    assert.deepEqual(
      parseProgress(serializeProgress(progress), questions),
      progress,
    );
  });

  test("broken, old or foreign data is read as empty, never thrown", () => {
    for (const raw of [
      "{not json",
      "null",
      "[]",
      JSON.stringify({ version: 0, results: { sample: answer } }),
      JSON.stringify({ version: 1, results: "x", checklists: 3 }),
    ]) {
      assert.deepEqual(parseProgress(raw, questions), emptyProgress(), raw);
    }
  });

  test("entries that do not fit the current questions are dropped", () => {
    const stored = {
      version: 1,
      results: {
        removed: answer,
        sample: { ...answer, testChoice: "z" },
      },
      checklists: { sample: [true] },
    };
    assert.deepEqual(
      parseProgress(JSON.stringify(stored), questions),
      emptyProgress(),
    );
  });

  test("a mark on an empty line, a repeated line or a sixth mark is invalid", () => {
    const withMarks = (lines: number[]) =>
      JSON.stringify({
        version: 1,
        results: {
          sample: {
            testChoice: "b",
            marks: lines.map((line) => ({
              line,
              severity: "minor",
              reason: "",
            })),
          },
        },
      });
    for (const lines of [[5], [2, 2], [1, 2, 3, 4, 6, 7], [11], []]) {
      assert.deepEqual(
        parseProgress(withMarks(lines), questions).results,
        {},
        String(lines),
      );
    }
  });
});

describe("progress summary", () => {
  test("counts per topic over solved questions only", () => {
    const list = makeQuestionList(2);
    const summary = summarizeProgress(list, {
      "web-1": {
        marks: [{ line: 2, severity: "major", reason: "" }],
        testChoice: "b",
      },
      "web-2": {
        marks: [{ line: 6, severity: "major", reason: "" }],
        testChoice: "a",
      },
      "api-1": {
        marks: [
          { line: 3, severity: "major", reason: "" },
          { line: 8, severity: "minor", reason: "" },
        ],
        testChoice: "b",
      },
    });
    const pick = ({
      topic,
      solved,
      bugsFound,
      bugsTotal,
      testsRight,
    }: (typeof summary)[number]) => ({
      topic,
      solved: solved.length,
      bugsFound,
      bugsTotal,
      testsRight,
    });
    assert.deepEqual(summary.map(pick), [
      { topic: "web", solved: 2, bugsFound: 1, bugsTotal: 4, testsRight: 1 },
      { topic: "api", solved: 1, bugsFound: 2, bugsTotal: 2, testsRight: 1 },
      {
        topic: "security",
        solved: 0,
        bugsFound: 0,
        bugsTotal: 0,
        testsRight: 0,
      },
      {
        topic: "testing",
        solved: 0,
        bugsFound: 0,
        bugsTotal: 0,
        testsRight: 0,
      },
    ]);
  });
});

describe("start and next (PRD K1)", () => {
  const list = makeQuestionList(2);

  test("a new user starts at the first question, a returning one at the first unsolved", () => {
    assert.equal(firstToStart(list, {}).id, "web-1");
    assert.equal(
      firstToStart(list, { "web-1": true, "api-1": true }).id,
      "web-2",
    );
  });

  test("next stays in the topic, then moves on to the next topic", () => {
    assert.deepEqual(nextStep(list[0]!, list, {}), {
      kind: "next",
      question: list[1],
    });
    assert.deepEqual(nextStep(list[1]!, list, {}), {
      kind: "nextTopic",
      topic: "api",
      question: list[2],
    });
  });

  test("the last topic leads back to the first, and all solved ends it", () => {
    const last = list.at(-1)!;
    assert.equal(nextStep(last, list, {}).kind, "nextTopic");
    const all = Object.fromEntries(list.map((q) => [q.id, true]));
    assert.deepEqual(nextStep(last, list, all), { kind: "allDone" });
  });
});
