/**
 * GET /api/summary: the sums behind the `SUMMARY_KEY` secret (Yusuf only).
 * Details in functions/README.md.
 */
import { catalogFrom } from "../_lib/catalog.ts";
import { summaryHandler } from "../_lib/handlers.ts";
import published from "../_lib/published-questions.js";

export const onRequest = summaryHandler({ catalog: catalogFrom(published) });
