/** What the prerender entry returns for one address (see scripts/prerender.ts). */
export interface RenderedPage {
  /** The address the markup was made for; empty for the shared 404 pages. */
  path: string;
  lang: "tr" | "en";
  title: string;
  description: string;
  /** The app's HTML for the address, placed inside <div id="root">. */
  body: string;
  /** The "this site needs JavaScript" line, in the page's language. */
  noscript: string;
  /** A script for the head, run before the page is painted. */
  headScript: string | null;
  canonical: string | null;
  alternates: { lang: "tr" | "en"; href: string }[];
  noindex: boolean;
}

export interface ServerEntry {
  listPaths(): string[];
  /** The not-found files ("/404.html", "/en/404.html"). */
  notFoundPaths(): string[];
  prepare(path: string): Promise<void>;
  renderPage(path: string): RenderedPage;
}
