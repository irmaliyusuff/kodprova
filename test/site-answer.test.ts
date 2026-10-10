import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  emptyDraft,
  findBlocker,
  MAX_MARKS,
  toggleMark,
  toSubmittedAnswer,
  updateMark,
  type Draft,
} from "../src/lib/marks.ts";
import { scoreAnswer, type SubmittedMark } from "../src/lib/scoring.ts";
import { buildSubmission, sendSubmission } from "../src/lib/submission.ts";
import { makeQuestion } from "./site-fixtures.ts";

const mark = (line: number, reason = ""): SubmittedMark => ({
  line,
  severity: "major",
  reason,
});

describe("scoring (PRD K8)", () => {
  const question = makeQuestion();

  test("a mark on the first or last line of a range finds the bug", () => {
    for (const line of [2, 3]) {
      const score = scoreAnswer(question, {
        marks: [mark(line)],
        testChoice: "b",
      });
      assert.deepEqual(
        score.bugs.map((bug) => bug.found),
        [true, false],
        `line ${line}`,
      );
      assert.equal(score.falseAlarms.length, 0);
    }
  });

  test("the lines just outside a range are false alarms", () => {
    const score = scoreAnswer(question, {
      marks: [mark(1), mark(4)],
      testChoice: "b",
    });
    assert.equal(score.found, 0);
    assert.deepEqual(
      score.falseAlarms.map((m) => m.line),
      [1, 4],
    );
  });

  test("two marks in one range find the bug once; both are listed", () => {
    const score = scoreAnswer(question, {
      marks: [mark(3), mark(2), mark(8)],
      testChoice: "a",
    });
    assert.equal(score.found, 2);
    assert.equal(score.total, 2);
    assert.deepEqual(
      score.bugs[0]!.marks.map((m) => m.line),
      [2, 3],
    );
    assert.equal(score.testCorrect, false);
  });

  test("severity, reason and test choice do not change what is found", () => {
    const lines = [2, 6, 8];
    const first = scoreAnswer(question, {
      marks: lines.map((line) => ({ line, severity: "minor", reason: "" })),
      testChoice: "a",
    });
    const second = scoreAnswer(question, {
      marks: lines.map((line) => ({
        line,
        severity: "critical",
        reason: "why",
      })),
      testChoice: "b",
    });
    const shape = (s: typeof first) => ({
      found: s.bugs.map((b) => b.found),
      alarms: s.falseAlarms.map((m) => m.line),
    });
    assert.deepEqual(shape(first), shape(second));
    assert.equal(second.testCorrect, true);
  });
});

describe("the answer being written (PRD K5–K7)", () => {
  test("a line toggles on and off, and marks stay in line order", () => {
    let draft: Draft = emptyDraft();
    for (const line of [7, 2]) {
      const result = toggleMark(draft, line);
      assert.equal(result.kind, "added");
      if (result.kind === "added") draft = result.draft;
    }
    assert.deepEqual(
      draft.marks.map((m) => m.line),
      [2, 7],
    );
    const removed = toggleMark(draft, 7);
    assert.equal(removed.kind, "removed");
  });

  test("a sixth mark is refused and the five marks stay", () => {
    let draft = emptyDraft();
    for (let line = 1; line <= MAX_MARKS; line++) {
      const result = toggleMark(draft, line);
      if (result.kind === "added") draft = result.draft;
    }
    assert.deepEqual(toggleMark(draft, 9), { kind: "limit" });
    assert.equal(draft.marks.length, MAX_MARKS);
  });

  test("the blockers come one at a time: marks, then severity, then test", () => {
    let draft = emptyDraft();
    assert.deepEqual(findBlocker(draft), { kind: "noMarks" });
    for (const line of [6, 3]) {
      const result = toggleMark(draft, line);
      if (result.kind === "added") draft = result.draft;
    }
    draft = updateMark(draft, 6, { severity: "major" });
    assert.deepEqual(findBlocker(draft), { kind: "noSeverity", line: 3 });
    draft = updateMark(draft, 3, { severity: "minor", reason: "because" });
    assert.deepEqual(findBlocker(draft), { kind: "noTest" });
    assert.equal(toSubmittedAnswer(draft), null);
    draft = { ...draft, testChoice: "c" };
    assert.equal(findBlocker(draft), null);
    assert.deepEqual(toSubmittedAnswer(draft), {
      marks: [
        { line: 3, severity: "minor", reason: "because" },
        { line: 6, severity: "major", reason: "" },
      ],
      testChoice: "c",
    });
  });
});

describe("counter request", () => {
  const question = makeQuestion();

  test("the body has exactly the agreed fields", () => {
    const score = scoreAnswer(question, {
      marks: [mark(2, "loses data"), mark(6, "looks odd")],
      testChoice: "b",
    });
    assert.deepEqual(buildSubmission(question.id, "en", score), {
      questionId: "sample",
      lang: "en",
      found: 1,
      total: 2,
      falseAlarms: 1,
      reasonGiven: true,
      testCorrect: true,
    });
  });

  test("a reason on a false alarm alone does not count as a reason given", () => {
    const score = scoreAnswer(question, {
      marks: [mark(2, "   "), mark(6, "looks odd")],
      testChoice: "a",
    });
    assert.equal(buildSubmission(question.id, "tr", score).reasonGiven, false);
  });

  test("the request has no cookies or referrer, and a failure is swallowed", async () => {
    const calls: [string, RequestInit][] = [];
    const failing = (async (url: string, init: RequestInit) => {
      calls.push([url, init]);
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    const score = scoreAnswer(question, { marks: [mark(8)], testChoice: "b" });
    sendSubmission(buildSubmission(question.id, "tr", score), failing);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(calls.length, 1);
    const [url, init] = calls[0]!;
    assert.equal(url, "/api/submissions");
    assert.equal(init.method, "POST");
    assert.equal(init.credentials, "omit");
    assert.equal(init.referrerPolicy, "no-referrer");
    assert.deepEqual(Object.keys(JSON.parse(init.body as string)).sort(), [
      "falseAlarms",
      "found",
      "lang",
      "questionId",
      "reasonGiven",
      "testCorrect",
      "total",
    ]);
  });
});
