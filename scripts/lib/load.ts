// Reads every question folder and validates it. Collects all problems instead
// of stopping at the first one, so an author sees everything to fix at once.
//
// Files in a question folder (<ext> is .ts, .js or .py):
//   question.json
//   original<ext>   the code as the AI wrote it (in the testing topic: a test)
//   fixed<ext>      the same code with every bug fixed
//   proof<ext>      proofs and test option checks
// Testing topic only:
//   subject<ext>            a correct implementation the tests run against
//   flawed-<bug id><ext>    per bug: an implementation the original test lets through

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  FILE_EXTENSIONS,
  LANGUAGES,
  LIMITS,
  TESTING_TOPIC,
  validateQuestion,
  type Language,
  type Question,
} from "./question.ts";

export interface QuestionCode {
  original: string;
  fixed: string;
  /** Testing topic only. */
  subject: string | null;
  /** Testing topic only: flawed implementation by bug id. */
  flawed: Record<string, string>;
}

export interface LoadedQuestion {
  dir: string;
  question: Question;
  extension: string;
  code: QuestionCode;
}

export interface LoadResult {
  questions: LoadedQuestion[];
  errors: string[];
}

export function codePath(dir: string, name: string, extension: string): string {
  return join(dir, `${name}${extension}`);
}

/**
 * Loads and validates the question folders. With `only`, just that folder is
 * read, so a half-written question elsewhere does not stop the run.
 */
export async function loadQuestions(
  questionsDir: string,
  only?: string,
): Promise<LoadResult> {
  const entries = await readdir(questionsDir, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .filter((name) => only === undefined || name === only)
    .sort();

  const questions: LoadedQuestion[] = [];
  const errors: string[] = [];
  for (const folder of folders) {
    const dir = join(questionsDir, folder);
    const result = await loadQuestion(dir, folder);
    const label = relative(process.cwd(), dir) || dir;
    errors.push(...result.errors.map((error) => `${label}: ${error}`));
    if (result.question) {
      questions.push(result.question);
    }
  }
  return { questions, errors };
}

async function loadQuestion(
  dir: string,
  folderName: string,
): Promise<{ question: LoadedQuestion | null; errors: string[] }> {
  const jsonText = await readText(join(dir, "question.json"));
  if (jsonText === null) {
    return { question: null, errors: ["missing file question.json"] };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch (error) {
    return {
      question: null,
      errors: [`question.json is not valid JSON: ${message(error)}`],
    };
  }
  const withoutCode = () =>
    validateQuestion(raw, {
      folderName,
      originalLineCount: null,
      fixedLineCount: null,
    }).errors;

  // The file names depend on the language, so read it before the full check.
  const language = (raw as { language?: unknown } | null)?.language;
  if (!LANGUAGES.includes(language as Language)) {
    return { question: null, errors: withoutCode() };
  }
  const extension = FILE_EXTENSIONS[language as Language];
  const errors: string[] = [];
  const read = (name: string) => readCode(dir, name, extension, errors);

  const original = await read("original");
  const fixed = await read("fixed");
  await read("proof");
  if (original === null || fixed === null) {
    return { question: null, errors: [...errors, ...withoutCode()] };
  }
  if (original === fixed) {
    errors.push(`fixed${extension} must differ from original${extension}`);
  }

  const result = validateQuestion(raw, {
    folderName,
    originalLineCount: lines(original).length,
    fixedLineCount: lines(fixed).length,
  });
  errors.push(...result.errors);
  const question = result.question;
  if (!question) {
    return { question: null, errors };
  }

  let subject: string | null = null;
  const flawed: Record<string, string> = {};
  if (question.topic === TESTING_TOPIC) {
    subject = await read("subject");
    for (const bug of question.bugs) {
      const text = await read(`flawed-${bug.id}`);
      if (text !== null) {
        flawed[bug.id] = text;
        if (text === subject) {
          errors.push(
            `flawed-${bug.id}${extension} must differ from subject${extension}`,
          );
        }
      }
    }
  }
  if (errors.length > 0) {
    return { question: null, errors };
  }
  return {
    question: {
      dir,
      question,
      extension,
      code: { original, fixed, subject, flawed },
    },
    errors: [],
  };
}

/** Reads a code file; records missing files, CRLF and long lines as errors. */
async function readCode(
  dir: string,
  name: string,
  extension: string,
  errors: string[],
): Promise<string | null> {
  const file = `${name}${extension}`;
  const text = await readText(codePath(dir, name, extension));
  if (text === null) {
    errors.push(`missing file ${file}`);
    return null;
  }
  if (text.includes("\r")) {
    errors.push(`${file} must use LF line endings`);
    return null;
  }
  if (name !== "proof") {
    lines(text).forEach((line, index) => {
      if (line.length > LIMITS.lineLength) {
        errors.push(
          `${file} line ${index + 1} is longer than ${LIMITS.lineLength} characters`,
        );
      }
    });
  }
  return text;
}

/** Splits code into lines; a final newline does not start a new line. */
export function lines(code: string): string[] {
  return code.replace(/\n$/, "").split("\n");
}

async function readText(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
