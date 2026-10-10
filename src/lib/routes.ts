// Every screen has its own address, and the language is the first part of it
// (/tr/…, /en/…), so a shared link opens in the same language (PRD K2).
// Paths end in "/" because each one is a folder with an index.html in dist/.

import { isLang, type Lang } from "../i18n/translate.ts";

export type Route =
  | { name: "home" }
  | { name: "list" }
  | { name: "question"; id: string }
  | { name: "result"; id: string }
  | { name: "progress" }
  | { name: "howItsMade" }
  | { name: "notFound" };

export interface Location {
  /** null when the path has no language part (only "/" is valid then). */
  lang: Lang | null;
  route: Route;
}

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * The address the not-found pages are prerendered for: it has no language
 * part, so their language links lead to each language's home page.
 */
export const NOT_FOUND_FILE = "/404.html";

export function parsePath(pathname: string): Location {
  const parts = pathname.split("/").filter(Boolean);
  const [first, ...rest] = parts;
  if (first === undefined) return { lang: null, route: { name: "home" } };
  if (!isLang(first)) return { lang: null, route: { name: "notFound" } };

  const route = ((): Route => {
    const [section, id, extra, ...more] = rest;
    if (more.length > 0) return { name: "notFound" };
    if (section === undefined) return { name: "home" };
    if (section === "progress" && id === undefined) return { name: "progress" };
    if (section === "how-its-made" && id === undefined)
      return { name: "howItsMade" };
    if (section !== "questions") return { name: "notFound" };
    if (id === undefined) return { name: "list" };
    if (!ID.test(id)) return { name: "notFound" };
    if (extra === undefined) return { name: "question", id };
    if (extra === "result") return { name: "result", id };
    return { name: "notFound" };
  })();
  return { lang: first, route };
}

export function pathFor(lang: Lang, route: Route): string {
  switch (route.name) {
    case "home":
      return `/${lang}/`;
    case "list":
      return `/${lang}/questions/`;
    case "question":
      return `/${lang}/questions/${route.id}/`;
    case "result":
      return `/${lang}/questions/${route.id}/result/`;
    case "progress":
      return `/${lang}/progress/`;
    case "howItsMade":
      return `/${lang}/how-its-made/`;
    case "notFound":
      return `/${lang}/404/`;
  }
}

/** The same screen in another language: only the first path part changes. */
export function switchLanguage(pathname: string, lang: Lang): string {
  const parts = pathname.split("/");
  if (isLang(parts[1])) parts[1] = lang;
  else return `/${lang}/`;
  return parts.join("/");
}
