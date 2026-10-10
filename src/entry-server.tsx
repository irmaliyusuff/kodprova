// Prerendering entry, used only at build time by scripts/prerender.ts: it
// renders one address to HTML and lists every address the site has.

import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App.tsx";
import { config } from "./config.ts";
import { loadQuestion, questions } from "./data/questions.ts";
import { LANGUAGES, translate } from "./i18n/translate.ts";
import { startLanguageScript } from "./lib/language.ts";
import type { RenderedPage } from "./lib/page.ts";
import { parsePath, pathFor, type Route } from "./lib/routes.ts";
import { pageDescription, pageTitle } from "./page-meta.ts";
import { StaticRouter } from "./router.tsx";

/** Every address to write as dist/<path>index.html. */
export function listPaths(): string[] {
  const routes: Route[] = [
    { name: "home" },
    { name: "list" },
    { name: "progress" },
    { name: "howItsMade" },
    ...questions.flatMap((question): Route[] => [
      { name: "question", id: question.id },
      { name: "result", id: question.id },
    ]),
  ];
  return LANGUAGES.flatMap((lang) =>
    routes.map((route) => pathFor(lang, route)),
  );
}

/** Loads what the address needs before it is rendered (a whole question). */
export async function prepare(path: string): Promise<void> {
  const { route } = parsePath(path);
  if (route.name === "question" || route.name === "result") {
    await loadQuestion(route.id);
  }
}

/**
 * One page. "/" is the Turkish home page plus a script that moves visitors
 * to their language; "/404.html" is the not-found page the host serves for
 * unknown addresses (Turkish; the app switches language from the address).
 */
export function renderPage(path: string): RenderedPage {
  const isRoot = path === "/";
  const isNotFound = path === "/404.html";
  const appPath = isRoot ? "/tr/" : isNotFound ? "/tr/404/" : path;
  const { lang, route } = parsePath(appPath);
  if (!lang) throw new Error(`Cannot prerender ${path}`);

  const body = renderToString(
    <StrictMode>
      <StaticRouter path={appPath}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
  const canonical =
    config.siteUrl && !isNotFound ? `${config.siteUrl}${appPath}` : null;
  return {
    path: isNotFound ? "" : appPath,
    lang,
    title: pageTitle(route, lang),
    description: pageDescription(lang),
    body,
    noscript: translate(lang, "ortak.noscript"),
    headScript: isRoot ? startLanguageScript() : null,
    canonical,
    alternates:
      config.siteUrl && !isNotFound
        ? LANGUAGES.map((other) => ({
            lang: other,
            href: `${config.siteUrl}${appPath.replace(/^\/(tr|en)\//, `/${other}/`)}`,
          }))
        : [],
    noindex: isNotFound,
  };
}
