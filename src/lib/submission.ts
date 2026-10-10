// The anonymous usage counter (PRD §8). One request per submitted answer, with
// numbers only: no reason text, checklist, marked lines or identity. The
// request carries no cookies and no referrer, nobody waits for it, and a
// failure is ignored (no retries). The counter is off unless the build turns
// it on (see config.ts); when it is off nothing is sent at all.

import type { Lang } from "../i18n/translate.ts";
import { hasReason, type Score } from "./scoring.ts";

export const SUBMISSIONS_ENDPOINT = "/api/submissions";

/** The request body agreed with the counter (functions/, POST → 204). */
export interface SubmissionBody {
  questionId: string;
  lang: Lang;
  found: number;
  total: number;
  falseAlarms: number;
  /** At least one mark that found a bug has a reason (one value per question). */
  reasonGiven: boolean;
  testCorrect: boolean;
}

export function buildSubmission(
  questionId: string,
  lang: Lang,
  score: Score,
): SubmissionBody {
  return {
    questionId,
    lang,
    found: score.found,
    total: score.total,
    falseAlarms: score.falseAlarms.length,
    reasonGiven: score.bugs.some((bug) => bug.marks.some(hasReason)),
    testCorrect: score.testCorrect,
  };
}

export function sendSubmission(
  body: SubmissionBody,
  send: typeof fetch = fetch,
): void {
  send(SUBMISSIONS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
    keepalive: true,
  }).catch(() => {
    // Counting is best effort: the user never sees a counter failure.
  });
}
