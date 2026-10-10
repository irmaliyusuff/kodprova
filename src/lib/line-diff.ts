// Line diff between the original and the fixed code, for the "Fixed code"
// view: longest common subsequence, removed lines before added ones at the
// same place, and only the changed places with a little context around them.

export type DiffKind = "same" | "removed" | "added";

export interface DiffLine {
  kind: DiffKind;
  /** Line number in the original code (absent for added lines). */
  oldNumber?: number;
  /** Line number in the fixed code (absent for removed lines). */
  newNumber?: number;
}

export function diffLines(before: string[], after: string[]): DiffLine[] {
  // common[i][j] = length of the LCS of before[i..] and after[j..]
  const common = Array.from({ length: before.length + 1 }, () =>
    new Array<number>(after.length + 1).fill(0),
  );
  for (let i = before.length - 1; i >= 0; i--) {
    for (let j = after.length - 1; j >= 0; j--) {
      common[i]![j] =
        before[i] === after[j]
          ? common[i + 1]![j + 1]! + 1
          : Math.max(common[i + 1]![j]!, common[i]![j + 1]!);
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length || j < after.length) {
    if (i < before.length && j < after.length && before[i] === after[j]) {
      lines.push({ kind: "same", oldNumber: ++i, newNumber: ++j });
    } else if (
      j === after.length ||
      (i < before.length && common[i + 1]![j]! >= common[i]![j + 1]!)
    ) {
      lines.push({ kind: "removed", oldNumber: ++i });
    } else {
      lines.push({ kind: "added", newNumber: ++j });
    }
  }
  return lines;
}

/**
 * Groups the changed lines into hunks, each with up to `context` unchanged
 * lines before and after. Hunks whose context would touch are merged.
 */
export function diffHunks(lines: DiffLine[], context = 2): DiffLine[][] {
  const keep = lines.map(() => false);
  lines.forEach((line, index) => {
    if (line.kind === "same") return;
    const from = Math.max(0, index - context);
    const to = Math.min(lines.length - 1, index + context);
    for (let k = from; k <= to; k++) keep[k] = true;
  });

  const hunks: DiffLine[][] = [];
  let current: DiffLine[] | null = null;
  lines.forEach((line, index) => {
    if (!keep[index]) {
      current = null;
      return;
    }
    if (!current) {
      current = [];
      hunks.push(current);
    }
    current.push(line);
  });
  return hunks;
}
