import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

type Box = ReturnType<typeof Code.createAutocomplete>;

const FRUITS = ["Apple", "Apricot", "Banana", "Blueberry"];

function typed(code: typeof Code, text: string): Box {
  const box = code.createAutocomplete(FRUITS);
  box.input(text);
  return box;
}

/**
 * A mouse click on a suggestion, in the order a browser sends it: pointerdown
 * on the option, then the input loses focus, then click. The click reaches
 * the option only if the list is still on screen.
 */
function clickWithMouse(box: Box, index: number): void {
  box.optionPointerDown(index);
  box.blur();
  if (box.suggestions()[index] !== undefined) {
    box.optionClick(index);
  }
}

export default {
  proofs: {
    "click-after-blur": (code) => {
      const box = typed(code, "ap");
      clickWithMouse(box, 1);
      assert.equal(box.value(), "Apricot");
      assert.deepEqual(box.suggestions(), []);
    },
  },
  options: {
    // a: Typing " AP" suggests Apple and Apricot.
    a: (code) =>
      assert.deepEqual(typed(code, " AP").suggestions(), ["Apple", "Apricot"]),
    // b: Leaving the input closes the list.
    b: (code) => {
      const box = typed(code, "ap");
      box.blur();
      assert.deepEqual(box.suggestions(), []);
    },
    // c (correct): A mouse click on the second suggestion, sent in the
    // browser's order (pointerdown, blur, click), fills in "Apricot".
    c: (code) => {
      const box = typed(code, "ap");
      clickWithMouse(box, 1);
      assert.equal(box.value(), "Apricot");
    },
    // d: Calling the click handler for the second suggestion fills in
    // "Apricot".
    d: (code) => {
      const box = typed(code, "ap");
      box.optionClick(1);
      assert.equal(box.value(), "Apricot");
    },
  },
} satisfies ProofSuite<typeof Code>;
