import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { messages } from "../src/i18n/messages.ts";
import { translate } from "../src/i18n/translate.ts";
import {
  countGraphemes,
  REASON_LIMIT,
  truncateGraphemes,
} from "../src/lib/graphemes.ts";
import { splitHyphenatedWords } from "../src/lib/hyphenated-words.ts";
import { splitInlineCode } from "../src/lib/inline-code.ts";
import { issueUrl } from "../src/lib/issue-link.ts";

describe("reason length (PRD K6)", () => {
  test("a Turkish letter and a whole emoji each count as one", () => {
    assert.equal(countGraphemes("ğüşıöçİ", "tr"), 7);
    assert.equal(countGraphemes("a👩🏽‍💻b", "tr"), 3);
  });

  test("cutting never splits an emoji and keeps exactly the limit", () => {
    const text = "ğ".repeat(REASON_LIMIT - 1) + "👩🏽‍💻" + "xyz";
    const cut = truncateGraphemes(text, REASON_LIMIT, "tr");
    assert.equal(countGraphemes(cut, "tr"), REASON_LIMIT);
    assert.ok(cut.endsWith("👩🏽‍💻"));
    assert.equal(truncateGraphemes("short", REASON_LIMIT, "en"), "short");
  });
});

describe("inline code in question texts", () => {
  test("only backtick pairs become code; the rest is plain text", () => {
    assert.deepEqual(splitInlineCode("Call `retry()` once, not `twice"), [
      { text: "Call ", code: false },
      { text: "retry()", code: true },
      { text: " once, not `twice", code: false },
    ]);
  });

  test("markup in the text stays text", () => {
    assert.deepEqual(splitInlineCode("<b>`<script>`</b>"), [
      { text: "<b>", code: false },
      { text: "<script>", code: true },
      { text: "</b>", code: false },
    ]);
  });
});

describe("hyphenated words in question titles", () => {
  test("a word with an inner hyphen is kept whole; the text is unchanged", () => {
    const parts = splitHyphenatedWords("Hoş geldin e-postası testleri");
    assert.deepEqual(parts, [
      { text: "Hoş geldin ", keepWhole: false },
      { text: "e-postası", keepWhole: true },
      { text: " testleri", keepWhole: false },
    ]);
    assert.equal(
      parts.map((part) => part.text).join(""),
      "Hoş geldin e-postası testleri",
    );
  });

  test("a dash between spaces, or a hyphen at a word's edge, is left alone", () => {
    assert.deepEqual(splitHyphenatedWords("A - B, pre- and -post"), [
      { text: "A - B, pre- and -post", keepWhole: false },
    ]);
    assert.deepEqual(splitHyphenatedWords("E-postayla"), [
      { text: "E-postayla", keepWhole: true },
    ]);
  });
});

describe("interface copy", () => {
  const slots = (value: string) =>
    [...value.matchAll(/\{[\w.]+\}/g)].map(String).sort();

  test("every message has both languages with the same slots", () => {
    for (const [key, { tr, en }] of Object.entries(messages)) {
      assert.ok(tr.trim() && en.trim(), `${key} is empty`);
      assert.deepEqual(slots(tr), slots(en), `${key} slots differ`);
    }
  });

  test("slots are filled, and the product name fills itself", () => {
    assert.equal(
      translate("en", "sekme.soru", { no: 9, "soru.baslik": "Retry" }),
      "Question 9: Retry · Kodprova",
    );
    assert.throws(() => translate("tr", "soru.sayac"), /\{n\}/);
  });
});

describe("report a problem link (PRD K15)", () => {
  test("opens a new issue with the question number and language only", () => {
    const url = new URL(issueUrl("https://github.com/owner/repo/", 9, "tr"));
    assert.equal(
      url.origin + url.pathname,
      "https://github.com/owner/repo/issues/new",
    );
    assert.equal(url.searchParams.get("title"), "Soru 9 (TR):");
    assert.equal(
      url.searchParams.get("body"),
      [
        "Soru: 9 · Dil: TR",
        "Ne gördün?",
        "Ne bekliyordun?",
        "İlgili satır (varsa):",
      ].join("\n\n"),
    );
    assert.deepEqual([...url.searchParams.keys()], ["title", "body"]);
  });
});
