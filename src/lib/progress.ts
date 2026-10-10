// Progress lives only in this browser (localStorage): the submitted answer of
// each solved question and the checklist ticks. The result is recomputed from
// the answer, so a stored result can never disagree with the scoring rule.
// Anything that does not fit the current questions is dropped on reading.

import { SEVERITIES, TOPICS } from "../../scripts/lib/question.ts";
import type { QuestionSummary, Topic } from "../data/types.ts";
import { MAX_MARKS } from "./marks.ts";
import {
  scoreAnswer,
  type SubmittedAnswer,
  type SubmittedMark,
} from "./scoring.ts";

export const PROGRESS_KEY = "kodprova.progress";
const VERSION = 1;

export interface Progress {
  /** Question id → the last submitted answer. */
  results: Record<string, SubmittedAnswer>;
  /** Question id → which checklist items are ticked. */
  checklists: Record<string, boolean[]>;
}

export const emptyProgress = (): Progress => ({ results: {}, checklists: {} });

export function serializeProgress(progress: Progress): string {
  return JSON.stringify({ version: VERSION, ...progress });
}

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readMark(
  value: unknown,
  question: QuestionSummary,
): SubmittedMark | null {
  if (!isObject(value)) return null;
  const { line, severity, reason } = value;
  if (typeof line !== "number" || !Number.isInteger(line)) return null;
  if (
    line < 1 ||
    line > question.lineCount ||
    question.emptyLines.includes(line)
  ) {
    return null;
  }
  if (!SEVERITIES.includes(severity as SubmittedMark["severity"])) return null;
  if (typeof reason !== "string") return null;
  return { line, severity: severity as SubmittedMark["severity"], reason };
}

function readAnswer(
  value: unknown,
  question: QuestionSummary,
): SubmittedAnswer | null {
  if (!isObject(value) || !Array.isArray(value.marks)) return null;
  const marks = value.marks.map((mark) => readMark(mark, question));
  const lines = new Set(marks.map((mark) => mark?.line));
  if (
    marks.length === 0 ||
    marks.length > MAX_MARKS ||
    marks.includes(null) ||
    lines.size !== marks.length
  ) {
    return null;
  }
  const testChoice = value.testChoice;
  if (
    !question.testQuestion.options.some((option) => option.id === testChoice)
  ) {
    return null;
  }
  return { marks: marks as SubmittedMark[], testChoice: testChoice as string };
}

function readChecklist(
  value: unknown,
  question: QuestionSummary,
): boolean[] | null {
  if (
    !Array.isArray(value) ||
    value.length !== question.checklistLength ||
    !value.every((item) => typeof item === "boolean")
  ) {
    return null;
  }
  return value as boolean[];
}

/** Reads stored progress; broken, old or unknown data becomes empty. */
export function parseProgress(
  raw: string | null,
  questions: QuestionSummary[],
): Progress {
  const progress = emptyProgress();
  if (raw === null) return progress;
  let stored: unknown;
  try {
    stored = JSON.parse(raw);
  } catch {
    return progress;
  }
  if (!isObject(stored) || stored.version !== VERSION) return progress;

  for (const question of questions) {
    const answer = isObject(stored.results)
      ? readAnswer(stored.results[question.id], question)
      : null;
    if (answer) progress.results[question.id] = answer;
    const checklist = isObject(stored.checklists)
      ? readChecklist(stored.checklists[question.id], question)
      : null;
    if (checklist) progress.checklists[question.id] = checklist;
  }
  return progress;
}

export interface TopicSummary {
  topic: Topic;
  questions: QuestionSummary[];
  solved: QuestionSummary[];
  bugsFound: number;
  /** Bugs in the solved questions only. */
  bugsTotal: number;
  testsRight: number;
}

/** One row per topic for the Progress table (copy deck §6). */
export function summarizeProgress(
  questions: QuestionSummary[],
  results: Progress["results"],
): TopicSummary[] {
  return TOPICS.map((topic) => {
    const inTopic = questions.filter((question) => question.topic === topic);
    const solved = inTopic.filter((question) => results[question.id]);
    const scores = solved.map((question) =>
      scoreAnswer(question, results[question.id]!),
    );
    return {
      topic,
      questions: inTopic,
      solved,
      bugsFound: scores.reduce((sum, score) => sum + score.found, 0),
      bugsTotal: scores.reduce((sum, score) => sum + score.total, 0),
      testsRight: scores.filter((score) => score.testCorrect).length,
    };
  });
}
