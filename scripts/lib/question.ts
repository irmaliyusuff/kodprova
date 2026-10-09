// The question format: types, allowed values and the validator.
// A question is a folder under questions/ that holds question.json and its code
// files (see load.ts and README.md for the file layout and a worked example).

export const TOPICS = ["web", "api", "security", "testing"] as const;
export const LANGUAGES = ["ts", "js", "python"] as const;
export const ORIGINS = ["real", "fictional"] as const;
export const SEVERITIES = ["critical", "major", "minor"] as const;

export type Topic = (typeof TOPICS)[number];
export type Language = (typeof LANGUAGES)[number];
export type Origin = (typeof ORIGINS)[number];
export type Severity = (typeof SEVERITIES)[number];

export const FILE_EXTENSIONS: Record<Language, string> = {
  ts: ".ts",
  js: ".js",
  python: ".py",
};

export const LIMITS = {
  codeLines: { min: 15, max: 60 },
  lineLength: 80,
  bugs: { min: 1, max: 2 },
  options: { min: 3, max: 4 },
  answerSentences: { min: 2, max: 4 },
  checklist: { min: 2, max: 4 },
} as const;

export const OPTION_IDS = ["a", "b", "c", "d"] as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface LocalizedText {
  tr: string;
  en: string;
}

/**
 * In the testing topic the question code is a test. It is proven against a
 * correct implementation (subject) and, for each bug, a flawed implementation
 * that the original test lets through.
 */
export const TESTING_TOPIC: Topic = "testing";

/** Inclusive, 1-based line numbers. */
export type LineRange = [start: number, end: number];

export interface Bug {
  id: string;
  /** Where the bug is in the original code; a mark inside counts as found. */
  lines: LineRange;
  /** Where the fix is in the fixed code. */
  fixedLines: LineRange;
  severity: Severity;
  explanation: LocalizedText;
  /** Testing topic only: what the implementation that slips past the test gets wrong. */
  flawedImplementation?: LocalizedText;
}

export interface TestOption {
  id: string;
  text: LocalizedText;
}

export interface TestQuestion {
  /** The bug that the correct option catches. */
  bug: string;
  options: TestOption[];
  correct: string;
}

export interface Question {
  id: string;
  title: LocalizedText;
  topic: Topic;
  difficulty: number;
  language: Language;
  origin: Origin;
  task: LocalizedText;
  deliveryNote: LocalizedText;
  bugs: Bug[];
  testQuestion: TestQuestion;
  sampleAnswer: LocalizedText;
  checklist: LocalizedText[];
}

/**
 * Facts about the question folder that the JSON alone cannot tell.
 * Line counts are null when the code files could not be read; code checks are
 * then skipped so that only the real problems are reported.
 */
export interface QuestionContext {
  folderName: string;
  originalLineCount: number | null;
  fixedLineCount: number | null;
}

export interface ValidationResult {
  question: Question | null;
  errors: string[];
}

type Json = Record<string, unknown>;

class Checker {
  readonly errors: string[] = [];

  fail(path: string, message: string): void {
    this.errors.push(`"${path}" ${message}`);
  }

  object(value: unknown, path: string): Json | null {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as Json;
    }
    this.fail(path, "must be an object");
    return null;
  }

  /** Reports missing required fields and unknown fields; true if all required exist. */
  keys(
    value: Json,
    path: string,
    required: readonly string[],
    optional: readonly string[] = [],
  ): boolean {
    let complete = true;
    for (const key of required) {
      if (!(key in value)) {
        this.errors.push(`missing field "${join(path, key)}"`);
        complete = false;
      }
    }
    for (const key of Object.keys(value)) {
      if (!required.includes(key) && !optional.includes(key)) {
        this.errors.push(`unknown field "${join(path, key)}"`);
      }
    }
    return complete;
  }

  text(value: unknown, path: string): string | null {
    if (typeof value !== "string" || value.trim() === "") {
      this.fail(path, "must be a non-empty string");
      return null;
    }
    return value;
  }

  localized(value: unknown, path: string): LocalizedText | null {
    const object = this.object(value, path);
    if (!object || !this.keys(object, path, ["tr", "en"])) {
      return null;
    }
    const tr = this.text(object.tr, join(path, "tr"));
    const en = this.text(object.en, join(path, "en"));
    return tr !== null && en !== null ? { tr, en } : null;
  }

  oneOf<T extends string>(
    value: unknown,
    path: string,
    allowed: readonly T[],
  ): T | null {
    if (
      typeof value === "string" &&
      (allowed as readonly string[]).includes(value)
    ) {
      return value as T;
    }
    this.fail(path, `must be one of: ${allowed.join(", ")}`);
    return null;
  }

  integer(
    value: unknown,
    path: string,
    min: number,
    max: number,
  ): number | null {
    if (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value >= min &&
      value <= max
    ) {
      return value;
    }
    this.fail(path, `must be a whole number from ${min} to ${max}`);
    return null;
  }

  list(
    value: unknown,
    path: string,
    min: number,
    max: number,
  ): unknown[] | null {
    if (!Array.isArray(value)) {
      this.fail(path, "must be a list");
      return null;
    }
    if (value.length < min || value.length > max) {
      this.fail(path, `must have ${min} to ${max} items (has ${value.length})`);
      return null;
    }
    return value;
  }

  lineRange(
    value: unknown,
    path: string,
    lineCount: number | null,
  ): LineRange | null {
    const range = this.list(value, path, 2, 2);
    if (!range) {
      return null;
    }
    const last = lineCount ?? Number.MAX_SAFE_INTEGER;
    const start = this.integer(range[0], `${path}[0]`, 1, last);
    const end = this.integer(range[1], `${path}[1]`, 1, last);
    if (start === null || end === null) {
      return null;
    }
    if (start > end) {
      this.fail(path, "must start before it ends");
      return null;
    }
    return [start, end];
  }

  slug(value: unknown, path: string): string | null {
    const text = this.text(value, path);
    if (text !== null && !SLUG.test(text)) {
      this.fail(path, "must be lowercase words joined by hyphens");
      return null;
    }
    return text;
  }
}

function join(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}

/** Counts sentences ending in . ! ? or … followed by a space or the end. */
export function countSentences(text: string): number {
  return text
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .filter((part) => part.trim() !== "").length;
}

const QUESTION_FIELDS = [
  "id",
  "title",
  "topic",
  "difficulty",
  "language",
  "origin",
  "task",
  "deliveryNote",
  "bugs",
  "testQuestion",
  "sampleAnswer",
  "checklist",
] as const;

export function validateQuestion(
  raw: unknown,
  context: QuestionContext,
): ValidationResult {
  const check = new Checker();
  const root = check.object(raw, "question.json");
  if (!root) {
    return { question: null, errors: check.errors };
  }
  check.keys(root, "", QUESTION_FIELDS);

  const id = "id" in root ? check.slug(root.id, "id") : null;
  if (id !== null && id !== context.folderName) {
    check.fail("id", `must match the folder name "${context.folderName}"`);
  }

  const { min: minLines, max: maxLines } = LIMITS.codeLines;
  const lineCount = context.originalLineCount;
  if (lineCount !== null && (lineCount < minLines || lineCount > maxLines)) {
    check.errors.push(
      `original code must have ${minLines} to ${maxLines} lines (has ${lineCount})`,
    );
  }

  const field = <T>(
    key: string,
    read: (value: unknown, path: string) => T | null,
  ): T | null => (key in root ? read(root[key], key) : null);

  const title = field("title", (v, p) => check.localized(v, p));
  const topic = field("topic", (v, p) => check.oneOf(v, p, TOPICS));
  const difficulty = field("difficulty", (v, p) => check.integer(v, p, 1, 5));
  const language = field("language", (v, p) => check.oneOf(v, p, LANGUAGES));
  const origin = field("origin", (v, p) => check.oneOf(v, p, ORIGINS));
  const task = field("task", (v, p) => check.localized(v, p));
  const deliveryNote = field("deliveryNote", (v, p) => check.localized(v, p));
  const bugs = field("bugs", (v, p) => readBugs(check, v, p, context, topic));
  const testQuestion = field("testQuestion", (v, p) =>
    readTestQuestion(check, v, p, bugs),
  );
  const sampleAnswer = field("sampleAnswer", (v, p) =>
    readSampleAnswer(check, v, p),
  );
  const checklist = field("checklist", (v, p) => readChecklist(check, v, p));

  if (check.errors.length > 0) {
    return { question: null, errors: check.errors };
  }
  return {
    question: {
      id: id!,
      title: title!,
      topic: topic!,
      difficulty: difficulty!,
      language: language!,
      origin: origin!,
      task: task!,
      deliveryNote: deliveryNote!,
      bugs: bugs!,
      testQuestion: testQuestion!,
      sampleAnswer: sampleAnswer!,
      checklist: checklist!,
    },
    errors: [],
  };
}

function readBugs(
  check: Checker,
  value: unknown,
  path: string,
  context: QuestionContext,
  topic: Topic | null,
): Bug[] | null {
  const items = check.list(value, path, LIMITS.bugs.min, LIMITS.bugs.max);
  if (!items) {
    return null;
  }
  const bugs: Bug[] = [];
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    const object = check.object(item, itemPath);
    if (!object) {
      return;
    }
    // Unknown topic: accept the testing field either way and report only the topic.
    const testingField = ["flawedImplementation"];
    const fields = ["id", "lines", "fixedLines", "severity", "explanation"];
    if (topic === TESTING_TOPIC) {
      check.keys(object, itemPath, [...fields, ...testingField]);
    } else {
      check.keys(object, itemPath, fields, topic === null ? testingField : []);
    }
    const at = (key: string) => join(itemPath, key);
    const id = "id" in object ? check.slug(object.id, at("id")) : null;
    const lines =
      "lines" in object
        ? check.lineRange(object.lines, at("lines"), context.originalLineCount)
        : null;
    const fixedLines =
      "fixedLines" in object
        ? check.lineRange(
            object.fixedLines,
            at("fixedLines"),
            context.fixedLineCount,
          )
        : null;
    const severity =
      "severity" in object
        ? check.oneOf(object.severity, at("severity"), SEVERITIES)
        : null;
    const explanation =
      "explanation" in object
        ? check.localized(object.explanation, at("explanation"))
        : null;
    const flawedImplementation =
      "flawedImplementation" in object
        ? check.localized(
            object.flawedImplementation,
            at("flawedImplementation"),
          )
        : null;
    if (id && lines && fixedLines && severity && explanation) {
      bugs.push({
        id,
        lines,
        fixedLines,
        severity,
        explanation,
        ...(flawedImplementation ? { flawedImplementation } : {}),
      });
    }
  });

  const ids = bugs.map((bug) => bug.id);
  if (new Set(ids).size !== ids.length) {
    check.fail(path, "must not repeat a bug id");
  }
  const [first, second] = bugs;
  if (
    first &&
    second &&
    first.lines[0] <= second.lines[1] &&
    second.lines[0] <= first.lines[1]
  ) {
    check.fail(
      path,
      "line ranges must not overlap, or a mark could count for both bugs",
    );
  }
  return bugs.length === items.length ? bugs : null;
}

function readTestQuestion(
  check: Checker,
  value: unknown,
  path: string,
  bugs: Bug[] | null,
): TestQuestion | null {
  const object = check.object(value, path);
  if (!object || !check.keys(object, path, ["bug", "options", "correct"])) {
    return null;
  }
  const bug = check.text(object.bug, join(path, "bug"));
  if (bug !== null && bugs && !bugs.some((item) => item.id === bug)) {
    check.fail(join(path, "bug"), `must name a bug in "bugs" (got "${bug}")`);
  }

  const optionsPath = join(path, "options");
  const items = check.list(
    object.options,
    optionsPath,
    LIMITS.options.min,
    LIMITS.options.max,
  );
  const options: TestOption[] = [];
  items?.forEach((item, index) => {
    const itemPath = `${optionsPath}[${index}]`;
    const option = check.object(item, itemPath);
    if (!option || !check.keys(option, itemPath, ["id", "text"])) {
      return;
    }
    const expectedId = OPTION_IDS[index];
    if (option.id !== expectedId) {
      check.fail(
        join(itemPath, "id"),
        `must be "${expectedId}" (options are a, b, c, d in order)`,
      );
    }
    const text = check.localized(option.text, join(itemPath, "text"));
    if (text && expectedId !== undefined && option.id === expectedId) {
      options.push({ id: expectedId, text });
    }
  });

  const correct = check.text(object.correct, join(path, "correct"));
  if (
    correct !== null &&
    items &&
    !items.some((_, index) => OPTION_IDS[index] === correct)
  ) {
    check.fail(
      join(path, "correct"),
      `must be the id of one of the options (got "${correct}")`,
    );
  }

  if (
    bug === null ||
    correct === null ||
    !items ||
    options.length !== items.length
  ) {
    return null;
  }
  return { bug, options, correct };
}

function readSampleAnswer(
  check: Checker,
  value: unknown,
  path: string,
): LocalizedText | null {
  const answer = check.localized(value, path);
  if (!answer) {
    return null;
  }
  const { min, max } = LIMITS.answerSentences;
  for (const lang of ["tr", "en"] as const) {
    const sentences = countSentences(answer[lang]);
    if (sentences < min || sentences > max) {
      check.fail(
        join(path, lang),
        `must be ${min} to ${max} sentences (has ${sentences})`,
      );
    }
  }
  return answer;
}

function readChecklist(
  check: Checker,
  value: unknown,
  path: string,
): LocalizedText[] | null {
  const items = check.list(
    value,
    path,
    LIMITS.checklist.min,
    LIMITS.checklist.max,
  );
  if (!items) {
    return null;
  }
  const checklist = items
    .map((item, index) => check.localized(item, `${path}[${index}]`))
    .filter((item): item is LocalizedText => item !== null);
  return checklist.length === items.length ? checklist : null;
}
