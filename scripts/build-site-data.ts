// npm run build:site-data
// Turns generated/questions.json (run `npm run build:questions` first) into
// the data the site imports (see src/data/types.ts): a small index of every
// question, and one file per question with its texts and coloured code.

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  lineText,
  type QuestionSummary,
  type SiteIndex,
  type SiteQuestion,
} from "../src/data/types.ts";
import { highlightCode } from "./lib/highlight.ts";
import type { PublicQuestion, PublishedQuestions } from "./lib/publish.ts";

const SOURCE = "generated/questions.json";
const INDEX = "generated/site-index.json";
const QUESTIONS_DIR = "generated/questions";

function toSiteQuestion(question: PublicQuestion, index: number): SiteQuestion {
  const code = highlightCode(question.code, question.language);
  return {
    id: question.id,
    number: index + 1,
    title: question.title,
    topic: question.topic,
    difficulty: question.difficulty,
    language: question.language,
    origin: question.origin,
    lineCount: code.length,
    emptyLines: code.flatMap((line, i) =>
      lineText(line).trim() === "" ? [i + 1] : [],
    ),
    checklistLength: question.checklist.length,
    task: question.task,
    deliveryNote: question.deliveryNote,
    code,
    fixedCode: highlightCode(question.fixedCode, question.language),
    bugs: question.bugs.map((bug) => ({
      id: bug.id,
      lines: bug.lines,
      severity: bug.severity,
      explanation: bug.explanation,
    })),
    testQuestion: question.testQuestion,
    sampleAnswer: question.sampleAnswer,
    checklist: question.checklist,
  };
}

function toSummary(question: SiteQuestion): QuestionSummary {
  return {
    id: question.id,
    number: question.number,
    title: question.title,
    topic: question.topic,
    difficulty: question.difficulty,
    language: question.language,
    origin: question.origin,
    lineCount: question.lineCount,
    emptyLines: question.emptyLines,
    bugs: question.bugs.map(({ lines, severity }) => ({ lines, severity })),
    testQuestion: {
      correct: question.testQuestion.correct,
      options: question.testQuestion.options.map(({ id }) => ({ id })),
    },
    checklistLength: question.checklistLength,
  };
}

const published = JSON.parse(
  await readFile(SOURCE, "utf8"),
) as PublishedQuestions;
// The published list is already in list order: topic, then difficulty.
const questions = published.questions.map(toSiteQuestion);

await rm(QUESTIONS_DIR, { recursive: true, force: true });
await mkdir(QUESTIONS_DIR, { recursive: true });
for (const question of questions) {
  await writeFile(
    join(QUESTIONS_DIR, `${question.id}.json`),
    JSON.stringify(question),
  );
}
// One date for the client and the server build, which both read this file.
const index: SiteIndex = {
  builtOn: new Date().toISOString().slice(0, 10),
  questions: questions.map(toSummary),
};
await writeFile(INDEX, `${JSON.stringify(index)}\n`);
console.log(
  `Wrote ${questions.length} question(s) to ${INDEX} and ${QUESTIONS_DIR}/`,
);
