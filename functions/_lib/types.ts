/**
 * The few Cloudflare types the counter uses, written by hand.
 *
 * Why not `@cloudflare/workers-types`: it is one more dependency and its
 * global types can clash with the site's own type check. These small
 * interfaces compile in both places (Workers and Node tests).
 */

export interface D1Result<T> {
  results: T[];
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

/**
 * Pages Function environment. Both values come from the Cloudflare dashboard
 * and may be missing, so both are optional.
 */
export interface Env {
  /** D1 binding (Settings > Bindings). */
  DB?: D1Database;
  /** Secret for the summary endpoint (Settings > Variables and Secrets). */
  SUMMARY_KEY?: string;
}

/** The part of the Pages Function context the counter uses. */
export interface Context {
  request: Request;
  env: Env;
}

export type Handler = (context: Context) => Promise<Response>;
