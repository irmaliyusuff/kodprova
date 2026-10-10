// The question data the site ships, built from generated/questions.json by
// scripts/build-site-data.ts. It comes in two parts so that a page loads only
// what it shows:
//   generated/site-index.json      every question's summary (list, progress,
//                                  scoring): small, part of the main bundle
//   generated/questions/<id>.json  one question in full (texts and code split
//                                  into syntax-coloured lines), loaded when
//                                  its Question or Result screen opens

import type {
  Language,
  LineRange,
  LocalizedText,
  Origin,
  Severity,
  Topic,
} from "../../scripts/lib/question.ts";

export type { Language, LineRange, LocalizedText, Origin, Severity, Topic };

/** The six colour roles of the design spec; anything else is plain text. */
export type SyntaxRole =
  "keyword" | "string" | "number" | "function" | "type" | "comment";

/** A run of code text, with its colour role when it has one. */
export type Token = [text: string, role?: SyntaxRole];

/** One line of code; an empty array is an empty line. */
export type CodeLine = Token[];

/** What scoring needs to know about a bug. */
export interface BugKey {
  lines: LineRange;
  severity: Severity;
}

export interface SiteBug extends BugKey {
  id: string;
  explanation: LocalizedText;
}

/** A question as the list, the progress page and the scoring rule see it. */
export interface QuestionSummary {
  id: string;
  /** Position in the question list, starting at 1 ("Question 9"). */
  number: number;
  title: LocalizedText;
  topic: Topic;
  difficulty: number;
  language: Language;
  origin: Origin;
  lineCount: number;
  /** Lines without code; they cannot be marked. */
  emptyLines: number[];
  bugs: BugKey[];
  testQuestion: { correct: string; options: { id: string }[] };
  checklistLength: number;
}

/** A whole question, for its Question and Result screens. */
export interface SiteQuestion extends QuestionSummary {
  task: LocalizedText;
  deliveryNote: LocalizedText;
  code: CodeLine[];
  fixedCode: CodeLine[];
  bugs: SiteBug[];
  testQuestion: {
    bug: string;
    options: { id: string; text: LocalizedText }[];
    correct: string;
  };
  sampleAnswer: LocalizedText;
  checklist: LocalizedText[];
}

export interface SiteIndex {
  questions: QuestionSummary[];
}

/** The text of a line, without its colour roles. */
export function lineText(line: CodeLine): string {
  return line.map(([text]) => text).join("");
}
