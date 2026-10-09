// Turns validated questions into the data the site ships. Fields are copied
// one by one (an allow list), so a field added to question.json for authors
// never reaches the published file by accident.

import type { LoadedQuestion } from "./load.ts";
import {
  TOPICS,
  type Bug,
  type LocalizedText,
  type Question,
} from "./question.ts";

export const PUBLISHED_FORMAT_VERSION = 1;

export type PublicBug = Omit<Bug, "flawedImplementation"> & {
  /** Testing topic only: the implementation the original test lets through. */
  flawedImplementation?: LocalizedText;
  flawedCode?: string;
};

export type PublicQuestion = Omit<Question, "bugs"> & {
  code: string;
  fixedCode: string;
  /** Testing topic only: the correct implementation the tests run against. */
  subjectCode?: string;
  bugs: PublicBug[];
};

export interface PublishedQuestions {
  formatVersion: number;
  questions: PublicQuestion[];
}

export function toPublicQuestion({
  question,
  code,
}: LoadedQuestion): PublicQuestion {
  return {
    id: question.id,
    title: question.title,
    topic: question.topic,
    difficulty: question.difficulty,
    language: question.language,
    origin: question.origin,
    task: question.task,
    deliveryNote: question.deliveryNote,
    code: code.original,
    fixedCode: code.fixed,
    ...(code.subject !== null ? { subjectCode: code.subject } : {}),
    bugs: question.bugs.map((bug) => ({
      id: bug.id,
      lines: bug.lines,
      fixedLines: bug.fixedLines,
      severity: bug.severity,
      explanation: bug.explanation,
      ...(bug.flawedImplementation
        ? {
            flawedImplementation: bug.flawedImplementation,
            flawedCode: code.flawed[bug.id],
          }
        : {}),
    })),
    testQuestion: {
      bug: question.testQuestion.bug,
      options: question.testQuestion.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
      correct: question.testQuestion.correct,
    },
    sampleAnswer: question.sampleAnswer,
    checklist: question.checklist,
  };
}

/** Topic order first, then easiest first, then id. */
export function publishQuestions(loaded: LoadedQuestion[]): PublishedQuestions {
  const questions = loaded
    .map(toPublicQuestion)
    .sort(
      (a, b) =>
        TOPICS.indexOf(a.topic) - TOPICS.indexOf(b.topic) ||
        a.difficulty - b.difficulty ||
        a.id.localeCompare(b.id),
    );
  return { formatVersion: PUBLISHED_FORMAT_VERSION, questions };
}
