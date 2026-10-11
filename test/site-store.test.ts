// When the app writes progress to the browser: only on the user's own actions
// (the Data page promises that a visitor who submits nothing has no progress
// record). The store is run as it is; only its Vite-only imports are replaced.

import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { beforeEach, describe, test } from "node:test";
import { makeQuestion } from "./site-fixtures.ts";

const question = makeQuestion();
const PROGRESS_KEY = "kodprova.progress";

// config.ts reads import.meta.env and questions.ts uses import.meta.glob,
// which only Vite provides; the store needs just these two values from them.
const STAND_INS: [string, string][] = [
  ["/src/config.ts", "export const config = { counterEnabled: false };"],
  [
    "/src/data/questions.ts",
    `export const questions = ${JSON.stringify([question])};`,
  ],
];
registerHooks({
  load(url, context, nextLoad) {
    const standIn = STAND_INS.find(([end]) => url.endsWith(end));
    if (!standIn) return nextLoad(url, context);
    return { format: "module", source: standIn[1], shortCircuit: true };
  },
});

/** localStorage that remembers which keys were written. */
class MemoryStorage {
  items = new Map<string, string>();
  written: string[] = [];
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.written.push(key);
    this.items.set(key, String(value));
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  progressWrites() {
    return this.written.filter((key) => key === PROGRESS_KEY).length;
  }
}

interface Store {
  loadSavedState(): void;
  toggleMark(questionId: string, line: number): string;
  setSeverity(questionId: string, line: number, severity: string): void;
  setTestChoice(questionId: string, choice: string): void;
  submitAnswer(question: unknown, lang: string): boolean;
  setChecklistItem(questionId: string, index: number, checked: boolean): void;
  resetProgress(): void;
}

// A variable, so the root tsc does not type-check the browser-only module.
const STORE_MODULE = "../src/state/store.ts";
const store = (await import(STORE_MODULE)) as Store;

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
});

describe("progress is written only by the user's actions", () => {
  test("a first visit leaves no progress record", () => {
    store.loadSavedState();
    assert.equal(storage.progressWrites(), 0);
    assert.equal(storage.getItem(PROGRESS_KEY), null);
  });

  test("reading a saved record does not write it back", () => {
    const saved = JSON.stringify({ version: 1, results: {}, checklists: {} });
    storage.items.set(PROGRESS_KEY, saved);
    store.loadSavedState();
    assert.equal(storage.progressWrites(), 0);
    assert.equal(storage.getItem(PROGRESS_KEY), saved);
  });

  test("marks are not saved until the answer is submitted", () => {
    store.loadSavedState();
    store.toggleMark(question.id, 2);
    store.setSeverity(question.id, 2, "critical");
    store.setTestChoice(question.id, "b");
    assert.equal(storage.progressWrites(), 0);

    assert.equal(store.submitAnswer(question, "tr"), true);
    assert.equal(storage.progressWrites(), 1);
    const record = JSON.parse(storage.getItem(PROGRESS_KEY) ?? "null");
    assert.deepEqual(Object.keys(record.results), [question.id]);
  });

  test("ticking the checklist and resetting write the record", () => {
    store.loadSavedState();
    store.setChecklistItem(question.id, 0, true);
    assert.equal(storage.progressWrites(), 1);
    store.resetProgress();
    assert.equal(storage.progressWrites(), 2);
    assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_KEY) ?? "null"), {
      version: 1,
      results: {},
      checklists: {},
    });
  });
});
