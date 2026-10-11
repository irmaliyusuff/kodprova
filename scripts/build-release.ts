// npm run build:release
// The build that is published: the counter on, the repository linked and a
// contact address given (VITE_CONTACT_EMAIL, required). Checks the settings
// first, then runs `npm run build` with them.

import { spawnSync } from "node:child_process";
import { releaseEnv, releaseProblems } from "./lib/release.ts";

const env = releaseEnv(process.env);
const problems = releaseProblems(env);
if (problems.length > 0) {
  console.error(`Release build stopped: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(
  `Release build: counter on, repository ${env.VITE_REPOSITORY_URL}, contact ${env.VITE_CONTACT_EMAIL}`,
);
const build = spawnSync("npm run build", {
  env,
  shell: true,
  stdio: "inherit",
});
process.exit(build.status ?? 1);
