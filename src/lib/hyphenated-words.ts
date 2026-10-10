// Browsers may break a line after the hyphen inside a word ("e-" / "postası").
// Question titles keep such words whole (spec v1.2): the word is wrapped
// in a span that does not wrap. The text itself never changes.

export interface WordPart {
  text: string;
  keepWhole: boolean;
}

/** A word with a hyphen between two letters or digits, like "e-postası". */
const HYPHENATED_WORD = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu;

export function splitHyphenatedWords(text: string): WordPart[] {
  const parts: WordPart[] = [];
  let last = 0;
  for (const match of text.matchAll(HYPHENATED_WORD)) {
    const start = match.index;
    if (start > last) {
      parts.push({ text: text.slice(last, start), keepWhole: false });
    }
    parts.push({ text: match[0], keepWhole: true });
    last = start + match[0].length;
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last), keepWhole: false });
  }
  return parts;
}
