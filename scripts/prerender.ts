// The last build step (see `npm run build`): writes one formatted HTML file
// per address into dist/, so every screen has real content, a title and a
// description before any script runs, and a refreshed address is never a 404.
//
// Input: dist/index.html and dist/.vite/manifest.json from the client build,
// generated/ssr/entry-server.js from the server build.

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { format } from "prettier";
import type { RenderedPage, ServerEntry } from "../src/lib/page.ts";
import { formatMarkup } from "./lib/format-markup.ts";

const DIST = "dist";
const SERVER_ENTRY = "generated/ssr/entry-server.js";
/** The two font files on the first screen (design spec §3). */
const PRELOAD_FONTS = [
  /ibm-plex-sans-latin-400-normal-.*\.woff2$/,
  /source-serif-4-latin-opsz-normal-.*\.woff2$/,
];
const OG_LOCALE = { tr: "tr_TR", en: "en_US" } as const;

const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

interface Manifest {
  [source: string]: { file: string; css?: string[]; assets?: string[] };
}

async function fontPreloads(): Promise<string[]> {
  const manifest = JSON.parse(
    await readFile(join(DIST, ".vite", "manifest.json"), "utf8"),
  ) as Manifest;
  const assets = Object.values(manifest).flatMap((chunk) => [
    chunk.file,
    ...(chunk.assets ?? []),
  ]);
  return PRELOAD_FONTS.map((pattern) => {
    const file = assets.find((asset) => pattern.test(asset));
    if (!file) throw new Error(`No font file matches ${pattern}`);
    return `<link rel="preload" href="/${file}" as="font" type="font/woff2" crossorigin />`;
  });
}

function headTags(page: RenderedPage, preloads: string[]): string {
  const meta = (attribute: string, key: string, value: string) =>
    `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
  return [
    `<title>${escapeHtml(page.title)}</title>`,
    meta("name", "description", page.description),
    page.noindex ? meta("name", "robots", "noindex") : "",
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", "Kodprova"),
    meta("property", "og:title", page.title),
    meta("property", "og:description", page.description),
    meta("property", "og:locale", OG_LOCALE[page.lang]),
    page.canonical ? meta("property", "og:url", page.canonical) : "",
    page.canonical ? `<link rel="canonical" href="${page.canonical}" />` : "",
    ...page.alternates.map(
      ({ lang, href }) =>
        `<link rel="alternate" hreflang="${lang}" href="${href}" />`,
    ),
    ...preloads,
    page.headScript ? `<script>${page.headScript}</script>` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function fillTemplate(
  template: string,
  page: RenderedPage,
  preloads: string[],
): string {
  const replace = (html: string, find: string | RegExp, value: string) => {
    if (!(typeof find === "string" ? html.includes(find) : find.test(html))) {
      throw new Error(`Template has no ${find}`);
    }
    return html.replace(find, () => value);
  };
  let html = template;
  html = replace(html, '<html lang="tr">', `<html lang="${page.lang}">`);
  html = replace(
    html,
    /<!-- Page title[^>]*-->\s*<title>Kodprova<\/title>/,
    headTags(page, preloads),
  );
  html = replace(
    html,
    '<div id="root"></div>',
    `<noscript><div class="sayfa"><p class="serit">${escapeHtml(page.noscript)}</p></div></noscript>\n` +
      rootPlaceholder(page),
  );
  return html;
}

/** The app container; the client hydrates it only on the address it was made for. */
const rootPlaceholder = (page: RenderedPage) =>
  `<div id="root" data-path="${page.path}"></div>`;

/**
 * Prettier formats the document around the app; the app markup itself is
 * formatted without touching its text (see format-markup.ts), because React
 * hydrates it and would treat changed whitespace as a mismatch.
 */
async function formatPage(html: string, page: RenderedPage): Promise<string> {
  const document = await format(html, { parser: "html", printWidth: 100 });
  const placeholder = rootPlaceholder(page);
  const line = document.split("\n").find((text) => text.trim() === placeholder);
  if (line === undefined)
    throw new Error("Formatted page has no app container");
  const indent = line.slice(0, line.indexOf("<"));
  const app = formatMarkup(
    placeholder.replace("></div>", `>${page.body}</div>`),
    indent,
  );
  return document.replace(line, () => indent + app);
}

const outputFile = (path: string) =>
  path.endsWith(".html") ? join(DIST, path) : join(DIST, path, "index.html");

const template = await readFile(join(DIST, "index.html"), "utf8");
const server = (await import(pathToFileURL(SERVER_ENTRY).href)) as ServerEntry;
const preloads = await fontPreloads();
const paths = ["/", "/404.html", ...server.listPaths()];

for (const path of paths) {
  await server.prepare(path);
  const page = server.renderPage(path);
  // Readable output: the page source is part of what a reviewer opens.
  const formatted = await formatPage(
    fillTemplate(template, page, preloads),
    page,
  );
  const file = outputFile(path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, formatted);
}
await rm(join(DIST, ".vite"), { recursive: true, force: true });
console.log(`Prerendered ${paths.length} page(s) into ${DIST}/`);
