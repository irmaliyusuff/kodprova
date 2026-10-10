/**
 * POST /api/submissions: anonymous count of one submitted question.
 * Contract: G8 work order; details in functions/README.md.
 *
 * This file only wires the real question catalog into the handler. The file
 * exports `onRequest` (not `onRequestPost`) so every other method gets a 405
 * from the counter instead of falling through to the site.
 */
import { catalogFrom } from "../_lib/catalog.ts";
import { submissionsHandler } from "../_lib/handlers.ts";
import published from "../_lib/published-questions.js";

export const onRequest = submissionsHandler({
  catalog: catalogFrom(published),
});
