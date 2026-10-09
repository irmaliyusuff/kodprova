// npm run build:questions [-- --dir questions --out generated/questions.json]
// Validates every question folder and writes the data the site ships.
// Any invalid question stops the build and names the field to fix.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { loadQuestions } from "./lib/load.ts";
import { publishQuestions } from "./lib/publish.ts";

const { values } = parseArgs({
  options: {
    dir: { type: "string", default: "questions" },
    out: { type: "string", default: "generated/questions.json" },
  },
});
const questionsDir = values.dir;
const outFile = values.out;

const { questions, errors } = await loadQuestions(questionsDir);
if (errors.length > 0) {
  console.error(
    `Build stopped: ${errors.length} problem(s) in the question files.\n`,
  );
  for (const error of errors) {
    console.error(`  ✖ ${error}`);
  }
  process.exit(1);
}

const published = publishQuestions(questions);
await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `${JSON.stringify(published, null, 2)}\n`);
console.log(`Wrote ${published.questions.length} question(s) to ${outFile}`);
