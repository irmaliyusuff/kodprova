// The result rule (PRD K8). Every bug has a line range; a bug is found when
// at least one mark falls inside its range, and a mark outside every range is
// a false alarm. Only the marked lines decide found / missed / false alarm;
// severity, reason and the test choice are reported next to it.

import type { BugKey, Severity } from "../data/types.ts";

export interface SubmittedMark {
  line: number;
  severity: Severity;
  /** What the user wrote; may be empty. Never leaves the device. */
  reason: string;
}

export interface SubmittedAnswer {
  marks: SubmittedMark[];
  testChoice: string;
}

export interface BugResult<Bug extends BugKey = BugKey> {
  bug: Bug;
  /** 1-based, in the question's bug order ("Bug 1"). */
  number: number;
  found: boolean;
  /** The marks inside this bug's range, in line order. */
  marks: SubmittedMark[];
}

export interface Score<Bug extends BugKey = BugKey> {
  bugs: BugResult<Bug>[];
  falseAlarms: SubmittedMark[];
  found: number;
  total: number;
  testCorrect: boolean;
}

export const isInRange = (line: number, [start, end]: [number, number]) =>
  line >= start && line <= end;

/** Works on a summary or a whole question; the bugs come back as given. */
export function scoreAnswer<Bug extends BugKey>(
  question: { bugs: Bug[]; testQuestion: { correct: string } },
  answer: SubmittedAnswer,
): Score<Bug> {
  const marks = [...answer.marks].sort((a, b) => a.line - b.line);
  const bugs = question.bugs.map((bug, index) => {
    const inside = marks.filter((mark) => isInRange(mark.line, bug.lines));
    return { bug, number: index + 1, found: inside.length > 0, marks: inside };
  });
  const falseAlarms = marks.filter(
    (mark) => !question.bugs.some((bug) => isInRange(mark.line, bug.lines)),
  );
  return {
    bugs,
    falseAlarms,
    found: bugs.filter((bug) => bug.found).length,
    total: bugs.length,
    testCorrect: answer.testChoice === question.testQuestion.correct,
  };
}

/** A reason counts as written when it has more than whitespace. */
export const hasReason = (mark: { reason: string }) =>
  mark.reason.trim() !== "";
