// Finds a Python 3.10+ interpreter for the Python questions.
//
// Order: the PYTHON environment variable (a command or path), then uv
// (`uv run --no-project python`, using a Python that uv already has; it never
// downloads one here), then python3 / python, except on Windows. On Windows
// those two names often point to an App Execution Alias that opens the
// Microsoft Store instead of running Python, so they are never called there.

import { spawnSync } from "node:child_process";

export const MIN_PYTHON = "3.10";

export interface PythonCommand {
  command: string;
  args: string[];
}

export interface PythonSearch {
  python: PythonCommand | null;
  tried: string[];
}

const UV: PythonCommand = {
  command: "uv",
  args: [
    "run",
    "--no-project",
    "--no-python-downloads",
    "--python",
    `>=${MIN_PYTHON}`,
    "python",
  ],
};

export function pythonCandidates(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): PythonCommand[] {
  if (env.PYTHON) {
    return [{ command: env.PYTHON, args: [] }];
  }
  const plain: PythonCommand[] = [
    { command: "python3", args: [] },
    { command: "python", args: [] },
  ];
  return platform === "win32" ? [UV] : [UV, ...plain];
}

export function findPython(env: NodeJS.ProcessEnv = process.env): PythonSearch {
  const tried: string[] = [];
  for (const candidate of pythonCandidates(env)) {
    tried.push([candidate.command, ...candidate.args].join(" "));
    const probe = spawnSync(
      candidate.command,
      [
        ...candidate.args,
        "-c",
        "import sys; print(sys.version_info >= (3, 10))",
      ],
      { encoding: "utf8", timeout: 30_000 },
    );
    if (probe.status === 0 && probe.stdout.trim() === "True") {
      return { python: candidate, tried };
    }
  }
  return { python: null, tried };
}
