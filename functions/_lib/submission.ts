/**
 * The submission body: the only data the site sends (PRD §8, G8 contract).
 *
 *   { "questionId": string, "lang": "tr" | "en", "found": int, "total": int,
 *     "falseAlarms": int, "reasonGiven": bool, "testCorrect": bool }
 *
 * Every field is required and nothing else is allowed. An unknown field is
 * rejected, not ignored: if the site ever starts sending more (a time, an id,
 * the reason text), the first local run shows it.
 */
import type { Catalog } from "./catalog.ts";

export const LANGS = ["tr", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** A user marks 1 to 5 lines (PRD K5). */
export const MARKS_MIN = 1;
export const MARKS_MAX = 5;

export interface Submission {
  questionId: string;
  lang: Lang;
  found: number;
  total: number;
  falseAlarms: number;
  reasonGiven: boolean;
  testCorrect: boolean;
}

const FIELDS = [
  "questionId",
  "lang",
  "found",
  "total",
  "falseAlarms",
  "reasonGiven",
  "testCorrect",
] as const satisfies readonly (keyof Submission)[];

export type FieldProblem =
  | "required"
  | "type"
  | "range"
  | "unknown_question"
  | "mismatch"
  | "unknown_field";

export type ValidationResult =
  | { ok: true; submission: Submission }
  | { ok: false; fields: Record<string, FieldProblem> };

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Checks one submission against the catalog.
 *
 * Rules beyond types, all true for any submission a working site can make:
 * - `total` is the question's bug count (1 or 2);
 * - `found` is at most `total`;
 * - every found bug needs its own mark and every false alarm is a mark, so
 *   `found + falseAlarms` is between 1 and 5 (PRD K5).
 * `reasonGiven` is not tied to `found`: whether a reason on a false alarm
 * counts is the site's rule (N-03), not a sign of a broken request.
 */
export function validateSubmission(
  body: Record<string, unknown>,
  catalog: Catalog,
): ValidationResult {
  // No prototype: a client key such as "__proto__" stays a plain entry.
  const fields: Record<string, FieldProblem> = Object.create(null);
  const allowed: ReadonlySet<string> = new Set(FIELDS);

  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) fields[key] = "unknown_field";
  }
  for (const key of FIELDS) {
    if (!Object.hasOwn(body, key)) fields[key] = "required";
  }

  const { questionId, lang, found, total, falseAlarms } = body;
  const { reasonGiven, testCorrect } = body;

  const bugs =
    typeof questionId === "string" ? catalog.get(questionId) : undefined;
  if (Object.hasOwn(body, "questionId")) {
    if (typeof questionId !== "string") fields.questionId = "type";
    else if (bugs === undefined) fields.questionId = "unknown_question";
  }
  if (Object.hasOwn(body, "lang") && !LANGS.includes(lang as Lang)) {
    fields.lang = typeof lang === "string" ? "range" : "type";
  }
  for (const [key, value] of [
    ["found", found],
    ["total", total],
    ["falseAlarms", falseAlarms],
  ] as const) {
    if (Object.hasOwn(body, key) && !isCount(value)) fields[key] = "type";
  }
  for (const [key, value] of [
    ["reasonGiven", reasonGiven],
    ["testCorrect", testCorrect],
  ] as const) {
    if (Object.hasOwn(body, key) && typeof value !== "boolean")
      fields[key] = "type";
  }

  if (isCount(total) && bugs !== undefined && total !== bugs) {
    fields.total = "mismatch";
  }
  if (isCount(found) && isCount(total) && found > total) {
    fields.found ??= "range";
  }
  if (isCount(found) && isCount(falseAlarms)) {
    const marks = found + falseAlarms;
    if (marks < MARKS_MIN || marks > MARKS_MAX) fields.falseAlarms ??= "range";
  }

  // Spread copies own keys only, so the result is an ordinary object.
  if (Object.keys(fields).length > 0)
    return { ok: false, fields: { ...fields } };
  return {
    ok: true,
    submission: {
      questionId: questionId as string,
      lang: lang as Lang,
      found: found as number,
      total: total as number,
      falseAlarms: falseAlarms as number,
      reasonGiven: reasonGiven as boolean,
      testCorrect: testCorrect as boolean,
    },
  };
}
