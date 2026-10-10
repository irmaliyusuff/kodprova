import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Code from "./fixed.ts";

const AT_ORIGIN: Code.View = { offsetX: 0, offsetY: 0, zoom: 1 };

/** A Space key event; `repeat` is true for the browser's auto-repeat. */
const space = (repeat = false): Code.Key => ({ code: "Space", repeat });

export default {
  proofs: {
    "space-repeat": (code) => {
      const board = code.createBoardControls(AT_ORIGIN);
      board.keyDown(space());
      board.keyDown(space(true)); // held long enough to auto-repeat
      board.keyDown(space(true));
      assert.equal(board.tool(), "hand");
      board.keyUp(space());
      assert.equal(board.tool(), "pen");
    },
    "pan-ignores-zoom": (code) => {
      const board = code.createBoardControls({ ...AT_ORIGIN, zoom: 2 });
      board.selectTool("hand");
      board.pointerDown(100, 100);
      board.pointerMove(160, 140);
      board.pointerUp();
      // 60 x 40 screen pixels at zoom 2 are 30 x 20 world units.
      assert.deepEqual(board.view(), { offsetX: -30, offsetY: -20, zoom: 2 });
    },
  },
  options: {
    // a: A short Space press switches to the hand and back to the pen.
    a: (code) => {
      const board = code.createBoardControls(AT_ORIGIN);
      board.keyDown(space());
      assert.equal(board.tool(), "hand");
      board.keyUp(space());
      assert.equal(board.tool(), "pen");
    },
    // b (correct): After Space is held long enough to auto-repeat and then
    // released, the tool is the pen again.
    b: (code) => {
      const board = code.createBoardControls(AT_ORIGIN);
      board.keyDown(space());
      board.keyDown(space(true));
      board.keyUp(space());
      assert.equal(board.tool(), "pen");
    },
    // c: With the eraser selected, losing window focus while Space is held
    // brings the eraser back.
    c: (code) => {
      const board = code.createBoardControls(AT_ORIGIN);
      board.selectTool("eraser");
      board.keyDown(space());
      board.windowBlur();
      assert.equal(board.tool(), "eraser");
    },
    // d: At zoom 1, dragging the hand 30 pixels right sets offsetX to -30.
    d: (code) => {
      const board = code.createBoardControls(AT_ORIGIN);
      board.selectTool("hand");
      board.pointerDown(0, 0);
      board.pointerMove(30, 0);
      assert.equal(board.view().offsetX, -30);
    },
  },
} satisfies ProofSuite<typeof Code>;
