// Test helper for the counter: an in-memory SQLite database that looks like
// Cloudflare D1 to the code (prepare -> bind -> all), with the real migration
// and the real SQL. The local D1 itself is tested in counter-e2e.ts.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  D1Database,
  D1PreparedStatement,
} from "../functions/_lib/types.ts";
import { REPO_ROOT } from "./helpers.ts";

export const MIGRATION = join(
  REPO_ROOT,
  "functions",
  "_migrations",
  "0001_submission_counts.sql",
);

// node:sqlite prints an "experimental feature" warning on load. Only that one
// warning is dropped, only while it loads, so `npm test` output stays clean.
const emitWarning = process.emitWarning;
process.emitWarning = function (warning: string | Error, ...rest: unknown[]) {
  const text = typeof warning === "string" ? warning : warning.message;
  if (text.startsWith("SQLite is an experimental feature")) return;
  return Reflect.apply(emitWarning, process, [warning, ...rest]);
} as typeof process.emitWarning;
const { DatabaseSync } = await import("node:sqlite");
process.emitWarning = emitWarning;

export type Row = Record<string, unknown>;

export interface MemoryD1 {
  d1: D1Database;
  /** Every stored row, as plain objects. */
  dump(): Row[];
  /** Runs raw SQL on the underlying database (test setup only). */
  exec(sql: string): void;
}

export async function memoryD1(): Promise<MemoryD1> {
  const db = new DatabaseSync(":memory:");
  db.exec(await readFile(MIGRATION, "utf8"));

  const statement = (sql: string, values: unknown[]): D1PreparedStatement => ({
    bind: (...next) => statement(sql, next),
    all: async <T>() => ({
      results: db
        .prepare(sql)
        .all(...(values as (string | number)[]))
        .map((row) => ({ ...row }) as T),
    }),
  });

  return {
    d1: { prepare: (sql) => statement(sql, []) },
    dump: () =>
      db
        .prepare("SELECT * FROM submission_counts ORDER BY 1, 2, 3, 4, 5, 6")
        .all()
        .map((row) => ({ ...row })),
    exec: (sql) => db.exec(sql),
  };
}

/** A database whose every query fails with an internal-looking message. */
export function failingD1(): D1Database {
  const statement: D1PreparedStatement = {
    bind: () => statement,
    all: async () => {
      throw new Error("D1_ERROR: SQLITE_CONSTRAINT internal detail");
    },
  };
  return { prepare: () => statement };
}

/** A database that fails the test if it is touched at all. */
export function untouchableD1(): D1Database {
  return {
    prepare: () => {
      throw new Error("The database must not be touched here.");
    },
  };
}
