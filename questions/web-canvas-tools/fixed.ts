export type Tool = "pen" | "eraser" | "hand";
export type View = { offsetX: number; offsetY: number; zoom: number };
export type Key = { code: string; repeat: boolean };

export function createBoardControls(initialView: View) {
  const view = { ...initialView };
  let tool: Tool = "pen";
  let toolBeforeSpace: Tool | null = null;
  let last: { x: number; y: number } | null = null;

  function releaseSpace(): void {
    if (toolBeforeSpace !== null) {
      tool = toolBeforeSpace;
      toolBeforeSpace = null;
    }
  }

  return {
    tool: () => tool,
    view: () => ({ ...view }),
    selectTool(next: Tool): void {
      if (toolBeforeSpace !== null) {
        toolBeforeSpace = next;
      } else {
        tool = next;
      }
    },
    keyDown(key: Key): void {
      if (key.code === "Space" && !key.repeat) {
        toolBeforeSpace = tool;
        tool = "hand";
      }
    },
    keyUp(key: Key): void {
      if (key.code === "Space") {
        releaseSpace();
      }
    },
    windowBlur(): void {
      releaseSpace();
      last = null;
    },
    pointerDown(x: number, y: number): void {
      last = tool === "hand" ? { x, y } : null;
    },
    pointerMove(x: number, y: number): void {
      if (last === null) {
        return;
      }
      view.offsetX -= (x - last.x) / view.zoom;
      view.offsetY -= (y - last.y) / view.zoom;
      last = { x, y };
    },
    pointerUp(): void {
      last = null;
    },
  };
}
