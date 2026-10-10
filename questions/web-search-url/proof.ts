import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

/** Reads the query the way the search page will: through URLSearchParams. */
function query(url: string): URLSearchParams {
  return new URL(url, "https://shop.example").searchParams;
}

const EMPTY: Code.SearchFilters = { term: "", category: "", page: 1 };

export default {
  proofs: {
    "unencoded-term": (code) => {
      const url = code.buildSearchUrl("/search", {
        ...EMPTY,
        term: "salt & pepper",
        category: "spices",
      });
      assert.equal(query(url).get("q"), "salt & pepper");
      assert.equal(query(url).get("category"), "spices");
      assert.deepEqual([...query(url).keys()], ["q", "category"]);
    },
  },
  options: {
    // a: With every field empty, the URL is the bare path.
    a: (code) => assert.equal(code.buildSearchUrl("/search", EMPTY), "/search"),
    // b: Spaces around the term are trimmed.
    b: (code) => {
      const url = code.buildSearchUrl("/search", { ...EMPTY, term: "  lamp " });
      assert.equal(query(url).get("q"), "lamp");
    },
    // c: Category and page 3 both appear in the URL.
    c: (code) => {
      const url = code.buildSearchUrl("/search", {
        ...EMPTY,
        category: "lamps",
        page: 3,
      });
      assert.equal(url, "/search?category=lamps&page=3");
    },
    // d (correct): The term "R&B" is read back as "R&B".
    d: (code) => {
      const url = code.buildSearchUrl("/search", { ...EMPTY, term: "R&B" });
      assert.equal(query(url).get("q"), "R&B");
    },
  },
} satisfies ProofSuite<typeof Code>;
