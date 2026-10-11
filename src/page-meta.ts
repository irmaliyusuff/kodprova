// The tab title and description of each screen, used both when prerendering
// and when the app changes screens.

import { findQuestion } from "./data/questions.ts";
import { translate, type Lang } from "./i18n/translate.ts";
import type { Route } from "./lib/routes.ts";

export function pageTitle(route: Route, lang: Lang): string {
  switch (route.name) {
    case "home":
      return translate(lang, "sekme.giris");
    case "list":
      return translate(lang, "sekme.liste");
    case "progress":
      return translate(lang, "sekme.ilerleme");
    case "howItsMade":
      return translate(lang, "sekme.hazirlandi");
    case "data":
      return translate(lang, "sekme.veri");
    case "question":
    case "result": {
      const question = findQuestion(route.id);
      if (!question) break;
      return route.name === "question"
        ? translate(lang, "sekme.soru", {
            no: question.number,
            "soru.baslik": question.title[lang],
          })
        : translate(lang, "sekme.sonuc", { no: question.number });
    }
  }
  return translate(lang, "sekme.bulunamadi");
}

/**
 * The copy deck has no per-page descriptions; every page uses the product's
 * one-sentence description.
 */
export const pageDescription = (lang: Lang) => translate(lang, "giris.tanim");
