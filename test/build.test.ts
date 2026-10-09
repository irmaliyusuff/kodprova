import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import {
  copyQuestions,
  editJson,
  FIXTURE_QUESTIONS,
  REAL_QUESTIONS,
  runScript,
} from "./helpers.ts";

const BUILD = "scripts/build-questions.ts";

const PUBLISHED_KEYS = new Set([
  "formatVersion",
  "questions",
  "id",
  "title",
  "topic",
  "difficulty",
  "language",
  "origin",
  "task",
  "deliveryNote",
  "code",
  "fixedCode",
  "subjectCode",
  "bugs",
  "lines",
  "fixedLines",
  "severity",
  "explanation",
  "flawedImplementation",
  "flawedCode",
  "testQuestion",
  "bug",
  "options",
  "text",
  "correct",
  "sampleAnswer",
  "checklist",
  "tr",
  "en",
]);

async function build(questionsDir: string) {
  const out = join(await mkdtemp(join(tmpdir(), "build-")), "questions.json");
  const run = runScript(BUILD, ["--dir", questionsDir, "--out", out]);
  const text = run.status === 0 ? await readFile(out, "utf8") : "";
  return { run, text };
}

/** Every object key anywhere in a JSON value. */
function allKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => allKeys(item, keys));
  } else if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      keys.add(key);
      allKeys(item, keys);
    }
  }
  return keys;
}

async function codeFile(question: string, file: string): Promise<string> {
  return readFile(join(FIXTURE_QUESTIONS, question, file), "utf8");
}

describe("build", () => {
  for (const [name, dir] of [
    ["fixture", FIXTURE_QUESTIONS],
    ["real questions", REAL_QUESTIONS],
  ] as const) {
    test(`the published data of the ${name} has only the published fields`, async () => {
      const { run, text } = await build(dir);
      assert.equal(run.status, 0, run.stderr);
      const published = JSON.parse(text);
      assert.ok(published.questions.length > 0);
      const extra = [...allKeys(published)].filter(
        (key) => !PUBLISHED_KEYS.has(key),
      );
      assert.deepEqual(extra, []);
    });
  }

  test("ships the original and fixed code with each question", async () => {
    const { text } = await build(FIXTURE_QUESTIONS);
    const question = JSON.parse(text).questions.find(
      (item: { id: string }) => item.id === "age-check",
    );
    assert.equal(question.code, await codeFile("age-check", "original.ts"));
    assert.equal(question.fixedCode, await codeFile("age-check", "fixed.ts"));
    assert.equal(question.subjectCode, undefined);
  });

  test("a testing question also ships the subject and the flawed code", async () => {
    const { text } = await build(FIXTURE_QUESTIONS);
    const question = JSON.parse(text).questions.find(
      (item: { id: string }) => item.id === "testing-discount",
    );
    const id = "testing-discount";
    assert.equal(question.subjectCode, await codeFile(id, "subject.ts"));
    assert.equal(
      question.bugs[0].flawedCode,
      await codeFile(id, "flawed-weak-assertion.ts"),
    );
    assert.ok(question.bugs[0].flawedImplementation.en);
  });

  test("a missing field stops the build and is named", async () => {
    const dir = await copyQuestions(FIXTURE_QUESTIONS);
    await editJson(join(dir, "age-check", "question.json"), (json) => {
      delete json.deliveryNote.en;
      delete json.bugs[1].severity;
    });
    const { run } = await build(dir);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /Build stopped: 2 problem/);
    assert.match(run.stderr, /age-check: missing field "deliveryNote\.en"/);
    assert.match(run.stderr, /age-check: missing field "bugs\[1\]\.severity"/);
  });

  test("a missing code file stops the build and is named", async () => {
    const dir = await copyQuestions(FIXTURE_QUESTIONS);
    await rm(join(dir, "age-check", "proof.ts"));
    await rm(join(dir, "testing-discount", "flawed-weak-assertion.ts"));
    const { run } = await build(dir);
    assert.equal(run.status, 1);
    assert.match(run.stderr, /age-check: missing file proof\.ts/);
    assert.match(
      run.stderr,
      /testing-discount: missing file flawed-weak-assertion\.ts/,
    );
  });
});
