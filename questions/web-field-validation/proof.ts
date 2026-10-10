import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

/** A form whose validator records which fields it checked, in order. */
function form(code: typeof Code) {
  const checked: string[] = [];
  const events = code.createPressAwareValidation((field) => {
    checked.push(field);
  });
  return { events, checked };
}

export default {
  proofs: {
    "press-left-open": (code) => {
      const { events, checked } = form(code);
      events.pointerDown();
      events.focusOut("name");
      events.pageLeft(); // the user switches tabs with the button down
      assert.deepEqual(checked, ["name"]);
      events.focusOut("message"); // back on the page, Tab out of a field
      assert.deepEqual(checked, ["name", "message"]);
    },
  },
  options: {
    // a (correct): After the page is left during a press, leaving a field
    // with Tab checks it at once.
    a: (code) => {
      const { events, checked } = form(code);
      events.pointerDown();
      events.pageLeft();
      events.focusOut("email");
      assert.deepEqual(checked, ["email"]);
    },
    // b: Without a press, leaving a field checks it at once.
    b: (code) => {
      const { events, checked } = form(code);
      events.focusOut("email");
      assert.deepEqual(checked, ["email"]);
    },
    // c: During a press the check waits, and the click runs it.
    c: (code) => {
      const { events, checked } = form(code);
      events.pointerDown();
      events.focusOut("email");
      assert.deepEqual(checked, []);
      events.click();
      assert.deepEqual(checked, ["email"]);
    },
    // d: A field that loses focus twice in one press is checked once.
    d: (code) => {
      const { events, checked } = form(code);
      events.pointerDown();
      events.focusOut("email");
      events.focusOut("email");
      events.pointerCancel();
      assert.deepEqual(checked, ["email"]);
    },
  },
} satisfies ProofSuite<typeof Code>;
