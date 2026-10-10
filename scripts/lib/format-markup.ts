// Line breaks for the prerendered app markup, which React later hydrates.
// React compares the page with what it renders, so formatting must not add,
// remove or change any text, not even whitespace between tags (Prettier
// does, in every whitespace mode). Breaks therefore go only *inside* tags,
// before the closing ">", where HTML ignores them:
//
//   <header class="ust"
//     ><a class="marka" href="/tr/">…</a
//     ><nav class="menu" aria-label="Menü"
//       ><a href="/tr/questions/">Sorular</a
//
// Text is never touched, so a line holding a long sentence or a line of code
// (<pre>) stays as long as the content.

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

const TOKEN = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w-]*)[^>]*>|[^<]+/g;

export function formatMarkup(html: string, indent = "", step = "  "): string {
  let out = "";
  let depth = 0;
  let preDepth = 0;
  let previousWasTag = false;

  for (const match of html.matchAll(TOKEN)) {
    const [token, name] = match;
    if (name === undefined) {
      // Text or a comment (React separates neighbouring texts with <!-- -->).
      out += token;
      previousWasTag = false;
      continue;
    }
    const tag = name.toLowerCase();
    const closing = token.startsWith("</");
    const selfClosing = token.endsWith("/>") || VOID_ELEMENTS.has(tag);
    if (closing) depth--;

    if (previousWasTag && preDepth === 0) {
      // Break inside the previous tag: "…attr"\n<indent>>" or "…"\n<indent>/>".
      const end = out.endsWith("/>") ? 2 : 1;
      out = `${out.slice(0, -end)}\n${indent}${step.repeat(depth)}${out.slice(-end)}`;
    }
    out += token;
    previousWasTag = true;

    if (tag === "pre") preDepth += closing ? -1 : 1;
    if (!closing && !selfClosing) depth++;
  }
  return out;
}
