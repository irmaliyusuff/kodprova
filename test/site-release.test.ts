// The release build's settings (scripts/lib/release.ts) and the Data page's
// date: the published page must not state something untrue.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  isReleaseBuild,
  RELEASE_REPOSITORY_URL,
  releaseEnv,
  releaseProblems,
} from "../scripts/lib/release.ts";
import { formatDay } from "../src/lib/dates.ts";

describe("release build settings", () => {
  test("without a contact address the release stops", () => {
    const problems = releaseProblems(releaseEnv({}));
    assert.equal(problems.length, 1);
    assert.match(problems[0] ?? "", /^VITE_CONTACT_EMAIL is not set/);
    assert.match(
      releaseProblems(
        releaseEnv({ VITE_CONTACT_EMAIL: "not an address" }),
      )[0] ?? "",
      /not an email address/,
    );
  });

  test("a release turns the counter on and links the repository", () => {
    const env = releaseEnv({ VITE_CONTACT_EMAIL: "someone@example.com" });
    assert.equal(env.VITE_COUNTER_ENABLED, "true");
    assert.equal(env.VITE_REPOSITORY_URL, RELEASE_REPOSITORY_URL);
    assert.equal(isReleaseBuild(env), true);
    assert.deepEqual(releaseProblems(env), []);
  });

  test("a counter turned off or a missing repository stops it too", () => {
    const problems = releaseProblems({
      VITE_CONTACT_EMAIL: "someone@example.com",
      VITE_COUNTER_ENABLED: "false",
    });
    assert.equal(problems.length, 2);
  });

  test("Cloudflare Pages builds are release builds; local ones are not", () => {
    assert.equal(isReleaseBuild({ CF_PAGES: "1" }), true);
    assert.equal(isReleaseBuild({}), false);
  });
});

describe("the Data page date", () => {
  test("is written out in each language, read as UTC", () => {
    assert.equal(formatDay("tr", "2026-10-26"), "26 Ekim 2026");
    assert.equal(formatDay("en", "2026-10-26"), "October 26, 2026");
    assert.equal(formatDay("tr", "2027-01-01"), "1 Ocak 2027");
    assert.throws(() => formatDay("en", "26.10.2026"));
  });
});
