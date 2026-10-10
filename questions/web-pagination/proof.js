import assert from "node:assert/strict";

export default {
  proofs: {
    "last-page-dropped": (code) => {
      const info = code.getPageInfo(5, 45, 10);
      assert.equal(info.totalPages, 5);
      assert.equal(info.page, 5);
      assert.equal(info.label, "41–45 / 45");
      assert.deepEqual(info.pages, [1, 2, 3, 4, 5]);
      assert.equal(code.getPageInfo(4, 45, 10).hasNext, true);
    },
  },
  options: {
    // a: Page 1 of 45 items, 10 per page, reads "1–10 / 45".
    a: (code) => assert.equal(code.getPageInfo(1, 45, 10).label, "1–10 / 45"),
    // b (correct): Page 5 of 45 items, 10 per page, reads "41–45 / 45".
    b: (code) => assert.equal(code.getPageInfo(5, 45, 10).label, "41–45 / 45"),
    // c: Asking for page 99 of 40 items, 10 per page, gives page 4.
    c: (code) => assert.equal(code.getPageInfo(99, 40, 10).page, 4),
    // d: With no items, the label is "0–0 / 0" and there is no next page.
    d: (code) => {
      const info = code.getPageInfo(1, 0, 10);
      assert.equal(info.label, "0–0 / 0");
      assert.equal(info.hasNext, false);
    },
  },
};
