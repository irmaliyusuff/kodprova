import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

export const REPO_ROOT = resolve(import.meta.dirname, "..");
export const FIXTURE_QUESTIONS = join(
  REPO_ROOT,
  "test",
  "fixtures",
  "questions",
);
export const REAL_QUESTIONS = join(REPO_ROOT, "questions");

/** Copies question folders to a fresh temp folder so a test can break them. */
export async function copyQuestions(
  from: string,
  only?: string[],
): Promise<string> {
  const target = join(await mkdtemp(join(tmpdir(), "questions-")), "questions");
  await cp(from, target, {
    recursive: true,
    filter: (source) =>
      !only ||
      source === from ||
      only.some((id) => {
        const folder = join(from, id);
        return source === folder || source.startsWith(folder + sep);
      }),
  });
  return target;
}

/** Replaces exactly one occurrence of `find` in a file. */
export async function editFile(
  path: string,
  find: string,
  replace: string,
): Promise<void> {
  const text = await readFile(path, "utf8");
  assert.equal(
    text.split(find).length,
    2,
    `expected exactly one "${find}" in ${path}`,
  );
  await writeFile(path, text.replace(find, replace));
}

export async function editJson(
  path: string,
  change: (json: any) => void,
): Promise<void> {
  const json = JSON.parse(await readFile(path, "utf8"));
  change(json);
  await writeFile(path, JSON.stringify(json, null, 2));
}

export interface ScriptRun {
  status: number | null;
  stdout: string;
  stderr: string;
}

export function runScript(
  script: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): ScriptRun {
  const run = spawnSync(process.execPath, [join(REPO_ROOT, script), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env,
  });
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}
