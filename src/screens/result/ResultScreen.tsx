// E4 Result: what was found, missed and wrongly flagged, each bug explained
// next to its lines; the right test; a sample interview answer; the fix.

import { Breadcrumb } from "../../components/QuestionHeader.tsx";
import type { SiteQuestion } from "../../data/types.ts";
import { scoreAnswer, type SubmittedAnswer } from "../../lib/scoring.ts";
import { FixDiff } from "./FixDiff.tsx";
import { ResultActions } from "./ResultActions.tsx";
import { ResultCode } from "./ResultCode.tsx";
import { ResultSummary } from "./ResultSummary.tsx";
import { AnswerSection, OriginBlock, TestResult } from "./ResultSections.tsx";

export function ResultScreen({
  question,
  answer,
}: {
  question: SiteQuestion;
  answer: SubmittedAnswer;
}) {
  const score = scoreAnswer(question, answer);
  return (
    <>
      <Breadcrumb question={question} />
      <ResultSummary question={question} score={score} />
      <ResultCode question={question} score={score} />
      <TestResult question={question} choice={answer.testChoice} />
      <AnswerSection question={question} answer={answer} />
      <FixDiff question={question} />
      <OriginBlock question={question} />
      <ResultActions question={question} />
    </>
  );
}
