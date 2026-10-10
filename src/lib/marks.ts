// The answer being written on the Question screen: marked lines, each with a
// severity and an optional reason, and the chosen test. The rules here are
// the ones the Submit button explains when it cannot submit yet (PRD K5–K7).

import type { Severity } from "../data/types.ts";
import type { SubmittedAnswer } from "./scoring.ts";

export const MAX_MARKS = 5;

export interface DraftMark {
  line: number;
  severity: Severity | null;
  reason: string;
}

export interface Draft {
  /** Always in line order. */
  marks: DraftMark[];
  testChoice: string | null;
}

export const emptyDraft = (): Draft => ({ marks: [], testChoice: null });

export type ToggleResult =
  | { kind: "added"; draft: Draft }
  | { kind: "removed"; draft: Draft }
  | { kind: "limit" };

/** Marks the line, or removes its mark; a sixth mark is refused. */
export function toggleMark(draft: Draft, line: number): ToggleResult {
  if (draft.marks.some((mark) => mark.line === line)) {
    return {
      kind: "removed",
      draft: {
        ...draft,
        marks: draft.marks.filter((mark) => mark.line !== line),
      },
    };
  }
  if (draft.marks.length >= MAX_MARKS) return { kind: "limit" };
  const marks = [...draft.marks, { line, severity: null, reason: "" }];
  marks.sort((a, b) => a.line - b.line);
  return { kind: "added", draft: { ...draft, marks } };
}

export function updateMark(
  draft: Draft,
  line: number,
  change: Partial<Omit<DraftMark, "line">>,
): Draft {
  return {
    ...draft,
    marks: draft.marks.map((mark) =>
      mark.line === line ? { ...mark, ...change } : mark,
    ),
  };
}

/** Why the answer cannot be submitted yet; one reason at a time, in this order. */
export type Blocker =
  | { kind: "noMarks" }
  | { kind: "noSeverity"; line: number }
  | { kind: "noTest" };

export function findBlocker(draft: Draft): Blocker | null {
  if (draft.marks.length === 0) return { kind: "noMarks" };
  const missing = draft.marks.find((mark) => mark.severity === null);
  if (missing) return { kind: "noSeverity", line: missing.line };
  if (draft.testChoice === null) return { kind: "noTest" };
  return null;
}

/** The draft as a submitted answer, or null while something is missing. */
export function toSubmittedAnswer(draft: Draft): SubmittedAnswer | null {
  if (findBlocker(draft) || draft.testChoice === null) return null;
  return {
    marks: draft.marks.map(({ line, severity, reason }) => ({
      line,
      severity: severity!,
      reason,
    })),
    testChoice: draft.testChoice,
  };
}
