// PRIVATE_NAMES_FILE=<path outside this repository> npm run scan-names
//
// Real-origin questions keep the pattern of a bug, never the client, project
// or person it came from, nor any internal reference to it. This scan looks
// for such names in every file git would commit, in the built question data,
// and in the whole git history (every commit message and every diff).
//
// The list itself would be a leak, so it must live outside the repository.
// One entry per line; lines starting with # are comments. A plain line matches
// as text, ignoring case and Turkish letters; a line starting with "re:" is a
// regular expression matched against the same folded text.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

const EXTRA_FILES = ["generated/questions.json"];

/** Lowercase with Turkish rules, then fold Turkish letters to ASCII. */
function fold(text: string): string {
  const folds: Record<string, string> = {
    ç: "c",
    ğ: "g",
    ı: "i",
    ö: "o",
    ş: "s",
    ü: "u",
  };
  return text
    .normalize("NFC")
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (letter) => folds[letter] ?? letter);
}

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

const listPath = process.env.PRIVATE_NAMES_FILE;
if (!listPath) {
  fail(
    "Set PRIVATE_NAMES_FILE to a file of names kept outside this repository.",
  );
}
const fromRepo = relative(process.cwd(), resolve(listPath));
const insideRepo = !fromRepo.startsWith("..") && !isAbsolute(fromRepo);
if (insideRepo) {
  fail(`${listPath} is inside the repository; keep the list outside it.`);
}
if (!existsSync(listPath)) {
  fail(`${listPath} not found.`);
}

interface Pattern {
  label: string;
  matches: (line: string) => boolean;
}

const patterns: Pattern[] = readFileSync(listPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line !== "" && !line.startsWith("#"))
  .map((entry, index) => {
    if (entry.startsWith("re:")) {
      const regex = new RegExp(entry.slice(3), "u");
      return {
        label: `pattern #${index + 1}`,
        matches: (line) => regex.test(line),
      };
    }
    const needle = fold(entry);
    return { label: entry, matches: (line) => line.includes(needle) };
  });

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

const files = git(
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "-z",
)
  .split("\0")
  .filter((file) => file !== "" && existsSync(file))
  .concat(EXTRA_FILES.filter((file) => existsSync(file)));

let hits = 0;
function scan(text: string, where: (lineIndex: number) => string): void {
  fold(text)
    .split("\n")
    .forEach((line, index) => {
      for (const pattern of patterns) {
        if (pattern.matches(line)) {
          hits += 1;
          console.log(`  ✖ ${where(index)} matches ${pattern.label}`);
        }
      }
    });
}

for (const file of files) {
  scan(readFileSync(file, "utf8"), (index) => `${file}:${index + 1}`);
}

let commits = 0;
let hasHistory = true;
try {
  git("rev-parse", "--verify", "--quiet", "HEAD");
} catch {
  hasHistory = false;
}
if (hasHistory) {
  // Every commit's message and full diff, so removed lines are found too.
  const history = git(
    "log",
    "--all",
    "-p",
    "--no-color",
    "--format=@@commit %h%n%B",
  );
  let commit = "?";
  const lines = history.split("\n");
  commits = lines.filter((line) => line.startsWith("@@commit ")).length;
  scan(history, (index) => {
    for (let i = index; i >= 0; i -= 1) {
      const line = lines[i] ?? "";
      if (line.startsWith("@@commit ")) {
        commit = line.slice("@@commit ".length);
        break;
      }
    }
    return `history, commit ${commit}`;
  });
}

console.log(
  `Scanned ${files.length} file(s) and ${commits} commit(s) of history` +
    ` for ${patterns.length} name(s) and pattern(s): ` +
    `${hits === 0 ? "none found" : `${hits} found`}.`,
);
process.exit(hits === 0 ? 0 : 1);
