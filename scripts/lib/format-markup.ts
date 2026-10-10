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
// A tag longer than LONG_TAG characters (a link with its address, class,
// target and rel) also puts each attribute on its own line, which is the same
// kind of whitespace inside a tag:
//
//   <a
//     href="https://github.com/…"
//     class="dugme"
//     target="_blank"
//     rel="noopener"
//     >…
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
const ATTRIBUTE = /[^\s"'=<>/]+(?:=(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g;
export const LONG_TAG = 80;

/** "<a href=… class=…>" as "<a" and one attribute per line, same ending. */
function splitAttributes(token: string, indent: string): string {
  const end = token.endsWith("/>") ? "/>" : ">";
  const nameEnd = token.search(/[\s/>]/);
  const attributes = token.slice(nameEnd, -end.length).match(ATTRIBUTE) ?? [];
  if (attributes.length < 2) return token;
  const lines = attributes.map((attribute) => `\n${indent}${attribute}`);
  return `${token.slice(0, nameEnd)}${lines.join("")}${end}`;
}

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
    out +=
      !closing && preDepth === 0 && token.length > LONG_TAG
        ? splitAttributes(token, indent + step.repeat(depth + 1))
        : token;
    previousWasTag = true;

    if (tag === "pre") preDepth += closing ? -1 : 1;
    if (!closing && !selfClosing) depth++;
  }
  return out;
}
