// Where the "start" and "next" buttons lead. Questions are in list order:
// topic by topic, easiest first.

import type { QuestionSummary, Topic } from "../data/types.ts";

type Solved = Record<string, unknown>;

/** The first question not solved yet; the very first one when all are (K1). */
export function firstToStart(
  questions: QuestionSummary[],
  solved: Solved,
): QuestionSummary {
  return questions.find((question) => !solved[question.id]) ?? questions[0]!;
}

export type NextStep =
  | { kind: "next"; question: QuestionSummary }
  | { kind: "nextTopic"; topic: Topic; question: QuestionSummary }
  | { kind: "allDone" };

/**
 * After a result: the next question in the topic; after the last question of
 * a topic, the first question of the next topic (the last topic leads back
 * to the first); once every question is solved, nothing further.
 */
export function nextStep(
  current: QuestionSummary,
  questions: QuestionSummary[],
  solved: Solved,
): NextStep {
  if (questions.every((question) => solved[question.id]))
    return { kind: "allDone" };
  const index = questions.findIndex((question) => question.id === current.id);
  const next = questions[(index + 1) % questions.length]!;
  if (next.topic === current.topic) return { kind: "next", question: next };
  return { kind: "nextTopic", topic: next.topic, question: next };
}
