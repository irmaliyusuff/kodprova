/**
 * The summary Yusuf reads for the 30-day FEEDBACK report (PRD §8).
 *
 * Only sums: no thresholds, no verdicts. Rates are left to the reader, so a
 * changed goal never needs a code change. Every question in the catalog is
 * listed, also with zero submissions, so an unplayed question is visible.
 */
import type { Catalog } from "./catalog.ts";
import type { DateRange, DayRow, QuestionRow } from "./store.ts";

export const SUMMARY_SCHEMA = 1;

export interface Sums {
  submissions: number;
  tr: number;
  en: number;
  /** Bugs found, summed over submissions. */
  foundBugs: number;
  /** Bugs in the submitted questions, summed over submissions. */
  totalBugs: number;
  /** Submissions that found every bug of their question. */
  allFound: number;
  falseAlarms: number;
  /** Submissions with a reason on at least one mark (N-03). */
  reasonGiven: number;
  /** Submissions with the right test choice. */
  testCorrect: number;
}

export interface QuestionSummary extends Sums {
  questionId: string;
  /** False for an id that has counts but is no longer in the catalog. */
  inCatalog: boolean;
}

export interface DaySummary {
  day: string;
  submissions: number;
  tr: number;
  en: number;
}

export interface Summary {
  schema: number;
  range: DateRange;
  firstDay: string | null;
  lastDay: string | null;
  dailyCap: number;
  /** Days that reached the cap: their counts are incomplete. */
  capReachedDays: string[];
  totals: Sums;
  byDay: DaySummary[];
  byQuestion: QuestionSummary[];
}

function emptySums(): Sums {
  return {
    submissions: 0,
    tr: 0,
    en: 0,
    foundBugs: 0,
    totalBugs: 0,
    allFound: 0,
    falseAlarms: 0,
    reasonGiven: 0,
    testCorrect: 0,
  };
}

function add(sums: Sums, row: QuestionRow): void {
  const n = Number(row.submissions);
  sums.submissions += n;
  sums[row.lang] += n;
  sums.foundBugs += Number(row.found);
  sums.totalBugs += Number(row.total);
  sums.allFound += Number(row.all_found);
  sums.falseAlarms += Number(row.false_alarms);
  sums.reasonGiven += Number(row.reason_given);
  sums.testCorrect += Number(row.test_correct);
}

export function summarize(
  catalog: Catalog,
  sums: { questions: QuestionRow[]; days: DayRow[] },
  range: DateRange,
  dailyCap: number,
): Summary {
  const totals = emptySums();
  const byQuestion = new Map<string, QuestionSummary>();
  for (const questionId of catalog.keys()) {
    byQuestion.set(questionId, {
      questionId,
      inCatalog: true,
      ...emptySums(),
    });
  }
  for (const row of sums.questions) {
    let question = byQuestion.get(row.question_id);
    if (question === undefined) {
      question = {
        questionId: row.question_id,
        inCatalog: false,
        ...emptySums(),
      };
      byQuestion.set(row.question_id, question);
    }
    add(question, row);
    add(totals, row);
  }

  const byDay = new Map<string, DaySummary>();
  for (const row of sums.days) {
    const day = byDay.get(row.day) ?? {
      day: row.day,
      submissions: 0,
      tr: 0,
      en: 0,
    };
    const n = Number(row.submissions);
    day.submissions += n;
    day[row.lang] += n;
    byDay.set(row.day, day);
  }
  const days = [...byDay.values()];

  return {
    schema: SUMMARY_SCHEMA,
    range,
    firstDay: days[0]?.day ?? null,
    lastDay: days.at(-1)?.day ?? null,
    dailyCap,
    capReachedDays: days
      .filter((day) => day.submissions >= dailyCap)
      .map((day) => day.day),
    totals,
    byDay: days,
    byQuestion: [...byQuestion.values()],
  };
}
