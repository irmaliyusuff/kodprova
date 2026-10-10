/**
 * Storage: counts only, never single submissions.
 *
 * One row is one combination of the submission fields on one day, with the
 * number of submissions that had exactly that combination. There is no row
 * per submission, no id, no time of day, nothing about who sent it
 * (migration 0001).
 */
import type { Lang, Submission } from "./submission.ts";
import type { D1Database } from "./types.ts";

/**
 * At most this many submissions are counted per day (UTC). The goal is 100
 * in 30 days (PRD S10b); the cap is far above any real day and stops a
 * script from inflating the numbers or using up the free daily quota.
 */
export const DAILY_CAP = 5000;

/** Day of `ms` in UTC as `YYYY-MM-DD`: the only time the counter keeps. */
export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

const RECORD_SQL = `INSERT INTO submission_counts
  (day, question_id, lang, found, total, false_alarms, reason_given, test_correct, submissions)
SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1
WHERE (SELECT COALESCE(SUM(submissions), 0) FROM submission_counts WHERE day = ?1) < ?9
ON CONFLICT (day, question_id, lang, found, total, false_alarms, reason_given, test_correct)
DO UPDATE SET submissions = submissions + 1
RETURNING submissions`;

/**
 * Adds one submission to the day's counts in a single statement, so the cap
 * check and the write cannot be split by another request.
 */
export async function recordSubmission(
  db: D1Database,
  submission: Submission,
  day: string,
  cap: number = DAILY_CAP,
): Promise<"counted" | "cap_reached"> {
  const { results } = await db
    .prepare(RECORD_SQL)
    .bind(
      day,
      submission.questionId,
      submission.lang,
      submission.found,
      submission.total,
      submission.falseAlarms,
      submission.reasonGiven ? 1 : 0,
      submission.testCorrect ? 1 : 0,
      cap,
    )
    .all();
  return results.length > 0 ? "counted" : "cap_reached";
}

export interface DateRange {
  from: string | null;
  to: string | null;
}

/** Sums per question and language. */
export interface QuestionRow {
  question_id: string;
  lang: Lang;
  submissions: number;
  found: number;
  total: number;
  all_found: number;
  false_alarms: number;
  reason_given: number;
  test_correct: number;
}

/** Sums per day and language. */
export interface DayRow {
  day: string;
  lang: Lang;
  submissions: number;
}

const RANGE = "day >= ?1 AND day <= ?2";

const QUESTION_SQL = `SELECT question_id, lang,
  SUM(submissions) AS submissions,
  SUM(found * submissions) AS found,
  SUM(total * submissions) AS total,
  SUM(CASE WHEN found = total THEN submissions ELSE 0 END) AS all_found,
  SUM(false_alarms * submissions) AS false_alarms,
  SUM(reason_given * submissions) AS reason_given,
  SUM(test_correct * submissions) AS test_correct
FROM submission_counts WHERE ${RANGE}
GROUP BY question_id, lang ORDER BY question_id, lang`;

const DAY_SQL = `SELECT day, lang, SUM(submissions) AS submissions
FROM submission_counts WHERE ${RANGE}
GROUP BY day, lang ORDER BY day, lang`;

/** Reads the sums the summary needs; output size does not grow with use. */
export async function readSums(
  db: D1Database,
  range: DateRange,
): Promise<{ questions: QuestionRow[]; days: DayRow[] }> {
  const from = range.from ?? "0000-01-01";
  const to = range.to ?? "9999-12-31";
  const [questions, days] = await Promise.all([
    db.prepare(QUESTION_SQL).bind(from, to).all<QuestionRow>(),
    db.prepare(DAY_SQL).bind(from, to).all<DayRow>(),
  ]);
  return { questions: questions.results, days: days.results };
}
