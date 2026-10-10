/**
 * The question catalog: which question ids exist and how many bugs each has.
 *
 * It comes from the same file the site ships (`generated/questions.json`,
 * built by `npm run build:questions`), so adding a question file is enough:
 * the counter accepts the new id after the next build, with no code change
 * (PRD K16).
 */

/** Question id -> number of bugs in that question. */
export type Catalog = ReadonlyMap<string, number>;

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ID_MAX_LENGTH = 64;
export const BUGS_MAX = 2;

/**
 * Builds the catalog from the published question data. Throws on any
 * surprise: a broken catalog must stop the service, not quietly accept or
 * reject everything.
 */
export function catalogFrom(published: unknown): Catalog {
  const questions =
    typeof published === "object" && published !== null
      ? (published as { questions?: unknown }).questions
      : undefined;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Question data has no questions.");
  }

  const catalog = new Map<string, number>();
  for (const question of questions as unknown[]) {
    const { id, bugs } = (question ?? {}) as { id?: unknown; bugs?: unknown };
    if (
      typeof id !== "string" ||
      id.length > ID_MAX_LENGTH ||
      !ID.test(id) ||
      catalog.has(id)
    ) {
      throw new Error("Question data has a missing, invalid or repeated id.");
    }
    if (!Array.isArray(bugs) || bugs.length < 1 || bugs.length > BUGS_MAX) {
      throw new Error(`Question ${id} must have 1 to ${BUGS_MAX} bugs.`);
    }
    catalog.set(id, bugs.length);
  }
  return catalog;
}
