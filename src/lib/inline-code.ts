// Question texts mark code with backticks (`retryPending`). Only that is
// interpreted: the text is otherwise shown as is, never as HTML or Markdown.
// A backtick without a partner stays plain text.

export interface TextPart {
  text: string;
  code: boolean;
}

export function splitInlineCode(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let rest = text;
  for (;;) {
    const open = rest.indexOf("`");
    const close = open === -1 ? -1 : rest.indexOf("`", open + 1);
    if (close === -1) {
      if (rest !== "") parts.push({ text: rest, code: false });
      return parts;
    }
    if (open > 0) parts.push({ text: rest.slice(0, open), code: false });
    parts.push({ text: rest.slice(open + 1, close), code: true });
    rest = rest.slice(close + 1);
  }
}
