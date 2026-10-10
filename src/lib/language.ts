// Which language "/" opens in: the one used last on this browser, otherwise
// Turkish for Turkish browsers and English for everyone else. Every other
// address carries its language, and the address always wins.

import { isLang, type Lang } from "../i18n/translate.ts";

export const LANGUAGE_KEY = "kodprova.lang";

export function pickStartLanguage(
  saved: string | null,
  browserLanguages: readonly string[],
): Lang {
  if (isLang(saved)) return saved;
  const first = browserLanguages[0]?.toLowerCase() ?? "";
  return first === "tr" || first.startsWith("tr-") ? "tr" : "en";
}

/**
 * The same rule as a script for the head of the prerendered "/" page, so a
 * visitor is sent to /en/ before anything Turkish is painted.
 */
export function startLanguageScript(): string {
  return `
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem(${JSON.stringify(LANGUAGE_KEY)});
  } catch (error) {}
  var browser = (navigator.languages && navigator.languages[0]) || navigator.language || "";
  browser = browser.toLowerCase();
  var lang = saved === "tr" || saved === "en" ? saved
    : browser === "tr" || browser.indexOf("tr-") === 0 ? "tr" : "en";
  if (lang === "en") location.replace("/en/");
  else history.replaceState(null, "", "/tr/");
})();
`;
}
