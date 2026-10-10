// Splits question code into syntax-coloured lines at build time, so the site
// ships plain data and no highlighter. highlight.js tokenizes the whole file
// at once (multi-line strings and comments come out right), then the result
// is cut into lines.

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import type { CodeLine, SyntaxRole, Token } from "../../src/data/types.ts";
import type { Language } from "./question.ts";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);

const HLJS_LANGUAGE: Record<Language, string> = {
  ts: "typescript",
  js: "javascript",
  python: "python",
};

/**
 * highlight.js scopes → the design's six roles. A scope that is not listed
 * takes its parent's role; a template substitution (`${…}`) resets to plain.
 */
function roleOf(scope: string): SyntaxRole | null | undefined {
  const [name, ...modifiers] = scope
    .split(" ")
    .map((s) => s.replace(/^hljs-/, ""));
  switch (name) {
    case "keyword":
    case "literal":
      return "keyword";
    case "string":
    case "regexp":
      return "string";
    case "number":
      return "number";
    case "comment":
      return "comment";
    case "type":
    case "built_in":
      return "type";
    case "title":
      if (modifiers.includes("function_")) return "function";
      if (modifiers.includes("class_")) return "type";
      return undefined;
    case "subst":
      return null;
    default:
      return undefined;
  }
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
};

const unescape = (html: string) =>
  html.replace(
    /&(?:amp|lt|gt|quot|#x27);/g,
    (entity) => ENTITIES[entity] ?? entity,
  );

/** Reads highlight.js output (only spans and escaped text) into tokens. */
function readHtml(html: string): Token[] {
  const tokens: Token[] = [];
  const roles: (SyntaxRole | null)[] = [null];
  for (const [part, scope] of html.matchAll(
    /<span class="([^"]+)">|<\/span>|[^<]+/g,
  )) {
    if (scope !== undefined) {
      const role = roleOf(scope);
      roles.push(role === undefined ? (roles.at(-1) ?? null) : role);
    } else if (part === "</span>") {
      roles.pop();
    } else {
      const role = roles.at(-1) ?? null;
      tokens.push(role ? [unescape(part), role] : [unescape(part)]);
    }
  }
  return tokens;
}

/** Joins neighbouring tokens of the same role to keep the data small. */
function merge(line: CodeLine): CodeLine {
  const merged: CodeLine = [];
  for (const token of line) {
    const last = merged.at(-1);
    if (last && last[1] === token[1]) {
      last[0] += token[0];
    } else {
      merged.push([...token]);
    }
  }
  return merged;
}

/**
 * The code as lines of tokens. Line n of the result is line n of the file;
 * the file's final newline does not start an extra line.
 */
export function highlightCode(code: string, language: Language): CodeLine[] {
  const source = code.endsWith("\n") ? code.slice(0, -1) : code;
  const html = hljs.highlight(source, {
    language: HLJS_LANGUAGE[language],
    ignoreIllegals: true,
  }).value;
  const lines: CodeLine[] = [[]];
  for (const [text, role] of readHtml(html)) {
    text.split("\n").forEach((piece, index) => {
      if (index > 0) lines.push([]);
      if (piece !== "") lines.at(-1)!.push(role ? [piece, role] : [piece]);
    });
  }
  return lines.map(merge);
}
