// Build-time settings. Values come from VITE_* environment variables when
// the site is built (see README); unset means the feature is off or hidden.

const env = import.meta.env;

export const config = {
  /** The anonymous counter (PRD §8). Off unless built with VITE_COUNTER_ENABLED=true. */
  counterEnabled: env.VITE_COUNTER_ENABLED === "true",
  /**
   * The public repository, e.g. https://github.com/<owner>/<repo>. Without it
   * the source, license and "Report a problem" links are left out.
   */
  repositoryUrl: env.VITE_REPOSITORY_URL || null,
  /** Where the site is published, for canonical and language alternate links. */
  siteUrl: env.VITE_SITE_URL || null,
  /**
   * The contact address on the Data page. A release build stops without it
   * (scripts/lib/release.ts); a local build shows CONTACT_EMAIL_PLACEHOLDER.
   */
  contactEmail: env.VITE_CONTACT_EMAIL || null,
  /** The counter deletes daily totals older than this (functions/). */
  retentionMonths: 25,
  cloudflarePrivacyUrl: "https://www.cloudflare.com/privacypolicy/",
  profileUrl: "https://github.com/irmaliyusuff",
  proofCommand: "npm run proof",
  /**
   * Every question has also been blind-solved once by a different AI model.
   * Until then the "How it's made" page uses the copy deck's shorter text.
   */
  secondModelBlindSolveDone: false,
} as const;

/** Shown by local builds made without VITE_CONTACT_EMAIL; never released. */
export const CONTACT_EMAIL_PLACEHOLDER = "[iletisim.eposta]";

/** Linked to the profile wherever the copy names the author; also the site owner on the Data page. */
export const PRODUCT_AUTHOR = "Yusuf Irmalı";

export const licenseUrl = (repositoryUrl: string) =>
  `${repositoryUrl.replace(/\/+$/, "")}/blob/main/LICENSE`;
