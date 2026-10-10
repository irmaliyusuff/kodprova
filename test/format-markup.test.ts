import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatMarkup } from "../scripts/lib/format-markup.ts";

/** Text between tags, in order: what React compares when it hydrates. */
const texts = (html: string) =>
  [...html.matchAll(/(?:^|>)([^<]*)/g)].map(([, text]) => text);

/** The markup with whitespace inside tags removed (before ">" and "/>"). */
const squeezed = (html: string) => html.replace(/\s+(\/?>)/g, "$1");

const SAMPLE =
  '<div class="a"><header><a href="/">Home</a><nav>' +
  '<a href="/x">X</a> · <a href="/y">Y</a></nav></header>' +
  "<p>One<!-- -->two <code>a &lt; b</code></p>" +
  '<input type="radio" checked=""/><pre class="k"><code>  if (x) {\n' +
  '    <span class="s">y</span></code></pre></div>';

describe("prerendered markup formatting", () => {
  const formatted = formatMarkup(SAMPLE, "    ");

  test("only adds line breaks inside tags", () => {
    assert.equal(squeezed(formatted), SAMPLE);
  });

  test("keeps every text node exactly, whitespace included", () => {
    assert.deepEqual(texts(formatted), texts(SAMPLE));
  });

  test("indents by nesting and leaves <pre> content alone", () => {
    assert.match(
      formatted,
      /^<div class="a"\n {6}><header\n {8}><a href="\/">Home<\/a\n/,
    );
    assert.ok(
      formatted.includes(
        '<pre class="k"><code>  if (x) {\n    <span class="s">y</span></code></pre',
      ),
    );
  });

  test("puts the attributes of a long tag on their own lines", () => {
    const link =
      '<p>See <a href="https://github.com/example/project/blob/main/LICENSE" ' +
      'class="dugme ikincil" target="_blank" rel="noopener">the license' +
      '<span class="gizli"> (opens in a new tab)</span></a>.</p>';
    const result = formatMarkup(link, "  ");
    assert.equal(squeezed(result.replace(/\n\s+(?=[a-z]+=)/g, " ")), link);
    assert.deepEqual(texts(result), texts(link));
    assert.ok(result.includes('<a\n      href="https://github.com/'), result);
    assert.ok(result.includes('\n      rel="noopener">the license'), result);
    assert.ok(result.split("\n").every((line) => line.length <= 100));
  });
});
