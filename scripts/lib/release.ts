// What a release build needs (`npm run build:release`, and any build on
// Cloudflare Pages). The Data page states these facts, so the site is not
// published while one of them is missing: it would say something untrue.

/** The public repository the release links to. */
export const RELEASE_REPOSITORY_URL =
  "https://github.com/irmaliyusuff/kodprova";

type Env = Record<string, string | undefined>;

/** A release build: `npm run build:release`, or Cloudflare Pages (CF_PAGES=1). */
export const isReleaseBuild = (env: Env) =>
  env.KODPROVA_RELEASE === "true" || env.CF_PAGES === "1";

/** The settings a release build adds when they are not given. */
export function releaseEnv(env: Env): Env {
  return {
    ...env,
    KODPROVA_RELEASE: "true",
    VITE_COUNTER_ENABLED: env.VITE_COUNTER_ENABLED ?? "true",
    VITE_REPOSITORY_URL: env.VITE_REPOSITORY_URL || RELEASE_REPOSITORY_URL,
  };
}

const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

/** Why these settings cannot be released; empty when they can. */
export function releaseProblems(env: Env): string[] {
  const problems: string[] = [];
  const email = env.VITE_CONTACT_EMAIL;
  if (!email) {
    problems.push(
      "VITE_CONTACT_EMAIL is not set: the Data page gives it as the contact address",
    );
  } else if (!EMAIL.test(email)) {
    problems.push(`VITE_CONTACT_EMAIL is not an email address: "${email}"`);
  }
  if (env.VITE_COUNTER_ENABLED !== "true") {
    problems.push(
      "VITE_COUNTER_ENABLED must be true: the Data page says every submission is counted",
    );
  }
  if (!env.VITE_REPOSITORY_URL) {
    problems.push(
      "VITE_REPOSITORY_URL is not set: the Data page names the source code and issue links",
    );
  }
  return problems;
}
