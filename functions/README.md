# Anonymous counter (`functions/`)

A small Cloudflare Pages Functions service next to the site. It counts
submitted questions so the project can tell whether people use it (PRD §8).
It stores **counts only**: no user, no device, no IP address, no time of day.

## Endpoints

| Method | Path               | Access                        | Does                               |
| ------ | ------------------ | ----------------------------- | ---------------------------------- |
| POST   | `/api/submissions` | public                        | Counts one submitted question      |
| GET    | `/api/summary`     | `Authorization: Bearer <key>` | Sums for the owner (30-day report) |

### `POST /api/submissions`

Body (`Content-Type: application/json`, at most 1 KB), all fields required,
no other field allowed:

```json
{
  "questionId": "web-search-url",
  "lang": "tr",
  "found": 1,
  "total": 1,
  "falseAlarms": 0,
  "reasonGiven": true,
  "testCorrect": false
}
```

- `questionId`: an id in `generated/questions.json`
- `lang`: `"tr"` or `"en"`
- `total`: the question's bug count (1 or 2); `found` ≤ `total`
- `found + falseAlarms`: 1 to 5 (one to five marked lines)
- `reasonGiven`: at least one mark has a reason (the text never leaves the
  browser); `testCorrect`: the right test was chosen

Answer: `204` with no body. The site does not wait for it and ignores errors.

### `GET /api/summary`

Optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` (UTC days, inclusive). Returns
`totals`, `byDay` and `byQuestion` (every question, also with zero
submissions): submissions, per language, bugs found / total, submissions that
found every bug, false alarms, reasons given, right test choices. No rates,
no thresholds.

```powershell
$key = Read-Host "Summary key"   # typed here only; never in a file or chat
Invoke-RestMethod "https://<site>/api/summary?from=2026-10-27" -Headers @{ Authorization = "Bearer $key" } | ConvertTo-Json -Depth 5
```

### Errors

`{ "ok": false, "error": { "code": "...", "fields": { "<field>": "<problem>" } } }`

| Status | Code                     | When                                                  |
| ------ | ------------------------ | ----------------------------------------------------- |
| 400    | `INVALID_REQUEST`        | Body is not a JSON object                             |
| 400    | `INVALID_INPUT`          | A field is missing, wrong or unknown (see `fields`)   |
| 401    | `UNAUTHORIZED`           | Summary without a key                                 |
| 403    | `FORBIDDEN`              | Summary with a wrong key, or no key set on the server |
| 405    | `METHOD_NOT_ALLOWED`     | Other method (`Allow` header names the right one)     |
| 413    | `PAYLOAD_TOO_LARGE`      | Body over 1 KB                                        |
| 415    | `UNSUPPORTED_MEDIA_TYPE` | Not `application/json`                                |
| 429    | `TOO_MANY_REQUESTS`      | Over 300 submissions a minute (per running copy)      |
| 429    | `DAILY_LIMIT`            | 5000 submissions already counted today (UTC)          |
| 500    | `SERVER_ERROR`           | Database error (no detail in the answer)              |
| 503    | `NOT_CONFIGURED`         | No database bound (e.g. preview deployments)          |

Field problems: `required`, `type`, `range`, `unknown_question`, `mismatch`,
`unknown_field`.

## Privacy

- The code reads three request headers: `Content-Type`, `Content-Length` and
  (summary only) `Authorization`. It never reads the IP address, `User-Agent`,
  `Referer`, cookies, language headers or `request.cf`. A unit test enforces
  this list.
- The database has one table of counts per UTC day
  (`_migrations/0001_submission_counts.sql`). A row is a combination of the
  fields above plus how many submissions had it. There is no row per
  submission.
- Nothing from a request is logged; the only log lines are three fixed texts
  (missing database binding, database error on count or on summary).

## Local use

```sh
npm install
cp .dev.vars.example .dev.vars   # then set SUMMARY_KEY (24+ characters)
npm run counter:migrate          # local database; first time and after new migrations
npm run counter:dev              # http://127.0.0.1:8788 (COUNTER_PORT to change)
npm test                         # unit tests (test/counter.test.ts), no server
npm run counter:e2e              # end-to-end: own server on 8799, empty database
```

`counter:dev` serves `dist/` when the site is built, otherwise a placeholder
page, and builds `generated/questions.json` if it is missing. Nothing here
touches a live database: no command uses `--remote`.

## Files

| Path                            | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `api/submissions.ts`            | Route: wires the real catalog into the handler              |
| `api/summary.ts`                | Route: same for the summary                                 |
| `_lib/handlers.ts`              | Both endpoints, order of checks                             |
| `_lib/submission.ts`            | Body validation                                             |
| `_lib/catalog.ts`               | Question ids and bug counts from the published data         |
| `_lib/published-questions.js`   | Imports `generated/questions.json` (bundled at deploy time) |
| `_lib/store.ts`                 | SQL: count with daily cap, read sums                        |
| `_lib/summary.ts`               | Summary shape                                               |
| `_lib/key.ts`                   | Summary key check (SHA-256, constant time)                  |
| `_lib/request.ts`               | Content type, body size limit                               |
| `_lib/rate.ts`                  | In-memory rate limit, no identity                           |
| `_lib/responses.ts`, `types.ts` | Response shape, hand-written Cloudflare types               |
| `_migrations/`                  | Database schema                                             |
| `_local/server.ts`              | Local server starter (`counter:dev`, e2e test)              |
| `wrangler.local.toml`           | Local database commands only; not read by Pages             |

Only files that export `onRequest` become routes; `_lib/`, `_local/` and
`_migrations/` never do.
