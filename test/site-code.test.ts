import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { highlightCode } from "../scripts/lib/highlight.ts";
import { lineText } from "../src/data/types.ts";
import { diffHunks, diffLines } from "../src/lib/line-diff.ts";
import {
  parsePath,
  pathFor,
  switchLanguage,
  type Route,
} from "../src/lib/routes.ts";
import { pickStartLanguage } from "../src/lib/language.ts";

describe("syntax colouring", () => {
  test("line n of the result is line n of the file, empty lines included", () => {
    const code = "const a = 1;\n\n// done\n";
    const lines = highlightCode(code, "ts");
    assert.deepEqual(lines.map(lineText), ["const a = 1;", "", "// done"]);
  });

  test("a comment and a string spanning lines are coloured on every line", () => {
    const lines = highlightCode(
      "/* one\n   two */\nconst s = `a\nb ${x} c`;",
      "ts",
    );
    assert.deepEqual(lines[1], [["   two */", "comment"]]);
    assert.deepEqual(lines[3], [
      ["b ", "string"],
      ["${x}"],
      [" c`", "string"],
      [";"],
    ]);
  });

  test("the roles of the design: keyword, string, number, function, type", () => {
    const [line] = highlightCode(
      'function f(n: number) { return "x" + 2; }',
      "ts",
    );
    const role = (text: string) => line!.find(([t]) => t === text)?.[1];
    assert.equal(role("function"), "keyword");
    assert.equal(role("f"), "function");
    assert.equal(role("number"), "type");
    assert.equal(role('"x"'), "string");
    assert.equal(role("2"), "number");
  });

  test("markup in code is kept as text", () => {
    const [line] = highlightCode('const tag = "<script>&amp;";', "js");
    assert.equal(lineText(line!), 'const tag = "<script>&amp;";');
  });

  test("Python is coloured too", () => {
    const [line] = highlightCode("def total(items):  # sum", "python");
    assert.equal(line!.find(([t]) => t === "def")?.[1], "keyword");
    assert.equal(line!.find(([t]) => t === "total")?.[1], "function");
    assert.equal(line!.at(-1)?.[1], "comment");
  });
});

describe("fixed code diff", () => {
  const before = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
  const after = ["a", "b", "c", "D", "D2", "e", "f", "g", "h", "i", "j"];

  test("removed lines come before added ones at the same place", () => {
    const kinds = diffLines(before, after)
      .map((line) => line.kind[0])
      .join("");
    assert.equal(kinds, "sssraassssss");
  });

  test("hunks keep two lines of context and number both sides", () => {
    const hunks = diffHunks(diffLines(before, after));
    assert.equal(hunks.length, 1);
    assert.deepEqual(
      hunks[0]!.map(({ kind, oldNumber, newNumber }) => [
        kind,
        oldNumber,
        newNumber,
      ]),
      [
        ["same", 2, 2],
        ["same", 3, 3],
        ["removed", 4, undefined],
        ["added", undefined, 4],
        ["added", undefined, 5],
        ["same", 5, 6],
        ["same", 6, 7],
      ],
    );
  });

  test("changes far apart make separate hunks", () => {
    const changed = ["A", ...before.slice(1, 9), "J"];
    assert.equal(diffHunks(diffLines(before, changed)).length, 2);
  });
});

describe("addresses (PRD K2)", () => {
  const routes: Route[] = [
    { name: "home" },
    { name: "list" },
    { name: "question", id: "api-event-retry" },
    { name: "result", id: "api-event-retry" },
    { name: "progress" },
    { name: "howItsMade" },
    { name: "data" },
  ];

  test("every screen's address reads back as the same screen and language", () => {
    for (const route of routes) {
      for (const lang of ["tr", "en"] as const) {
        assert.deepEqual(parsePath(pathFor(lang, route)), { lang, route });
      }
    }
  });

  test("unknown addresses are not found", () => {
    for (const path of [
      "/de/",
      "/tr/nope/",
      "/tr/questions/a/b/",
      "/tr/questions/Bad_Id/",
    ]) {
      assert.equal(parsePath(path).route.name, "notFound", path);
    }
  });

  test("switching language keeps the screen", () => {
    assert.equal(
      switchLanguage("/tr/questions/web-pagination/result/", "en"),
      "/en/questions/web-pagination/result/",
    );
  });

  test("the start language: saved choice, then a Turkish browser, else English", () => {
    assert.equal(pickStartLanguage("en", ["tr-TR"]), "en");
    assert.equal(pickStartLanguage(null, ["tr-TR", "en"]), "tr");
    assert.equal(pickStartLanguage("xx", ["de-DE", "tr"]), "en");
  });
});
