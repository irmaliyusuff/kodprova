// Small hand-made questions for the site's logic tests.

import type { SiteQuestion, Topic } from "../src/data/types.ts";

const text = (value: string) => ({ tr: value, en: value });

/**
 * A question with 10 lines of code (line 5 is empty) and, by default, two
 * bugs: lines 2–3 (critical) and line 8 (minor). The right test is "b".
 */
export function makeQuestion(
  overrides: Partial<SiteQuestion> = {},
): SiteQuestion {
  const code = Array.from({ length: 10 }, (_, index) =>
    index === 4 ? [] : [[`line ${index + 1}`] as [string]],
  );
  return {
    id: "sample",
    number: 1,
    title: text("Sample"),
    topic: "web",
    difficulty: 1,
    language: "ts",
    origin: "fictional",
    lineCount: 10,
    emptyLines: [5],
    checklistLength: 2,
    task: text("Task"),
    deliveryNote: text("Done."),
    code,
    fixedCode: code,
    bugs: [
      {
        id: "first",
        lines: [2, 3],
        severity: "critical",
        explanation: text("A"),
      },
      {
        id: "second",
        lines: [8, 8],
        severity: "minor",
        explanation: text("B"),
      },
    ],
    testQuestion: {
      bug: "first",
      options: ["a", "b", "c"].map((id) => ({
        id,
        text: text(`Option ${id}`),
      })),
      correct: "b",
    },
    sampleAnswer: text("One. Two."),
    checklist: [text("I said it"), text("I tested it")],
    ...overrides,
  };
}

/** Four topics × `perTopic` questions, in list order. */
export function makeQuestionList(perTopic = 2): SiteQuestion[] {
  const topics: Topic[] = ["web", "api", "security", "testing"];
  return topics.flatMap((topic, t) =>
    Array.from({ length: perTopic }, (_, d) =>
      makeQuestion({
        id: `${topic}-${d + 1}`,
        number: t * perTopic + d + 1,
        topic,
        difficulty: d + 1,
      }),
    ),
  );
}
