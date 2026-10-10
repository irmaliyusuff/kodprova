// Margin notes on wide screens (spec §7). Each note sits in the DOM right
// after its line, inside the code box. From 1240 px (77.5rem) CSS takes the
// notes out to the right-hand column; this hook then lines each note up with
// the middle of its line, pushes it down when it would overlap the one
// above, and tells the connector line how far it was pushed (--kayma).
// Below 1240 px the notes open under their lines and need no script.

import { useLayoutEffect, type DependencyList, type RefObject } from "react";

const WIDE = "(min-width: 77.5rem)";
const GAP = 16;

function clear(section: HTMLElement, notes: HTMLElement[]): void {
  for (const note of notes) {
    note.style.removeProperty("top");
    note.style.removeProperty("--kayma");
  }
  section.style.removeProperty("min-height");
}

function place(section: HTMLElement): void {
  const notes = [...section.querySelectorAll<HTMLElement>(".kod-kap .not")];
  clear(section, notes);
  if (!window.matchMedia(WIDE).matches) return;

  const head = section.querySelector<HTMLElement>(".kenar-bas");
  let bottom = head ? head.offsetTop + head.offsetHeight + GAP : 0;
  for (const note of notes) {
    const line = section.querySelector<HTMLElement>(
      `.satir[data-satir="${note.dataset.notSatir}"]`,
    );
    if (!line) continue;
    // The note's 2 px top rule meets the middle of the line.
    const target = line.offsetTop + line.offsetHeight / 2 - 1;
    const top = Math.max(target, bottom);
    note.style.top = `${top}px`;
    note.style.setProperty("--kayma", `${top - target}px`);
    bottom = top + note.offsetHeight + GAP;
  }
  // Keep the next section below the last note.
  section.style.minHeight = `${bottom}px`;
}

/**
 * Re-places the notes whenever the code, a note or the margin head changes
 * size, the window crosses the wide breakpoint, or the fonts finish loading.
 * Pass the values that add or remove notes as `deps`.
 */
export function useMarginNotes(
  sectionRef: RefObject<HTMLElement | null>,
  deps: DependencyList,
): void {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const update = () => place(section);
    update();

    // Not the section itself: its min-height is what we set.
    const observer = new ResizeObserver(update);
    for (const element of section.querySelectorAll(
      ".kod-kap, .kenar-bas, .kod-kap .not",
    )) {
      observer.observe(element);
    }
    const wide = window.matchMedia(WIDE);
    wide.addEventListener("change", update);
    let active = true;
    void document.fonts?.ready.then(() => active && update());
    return () => {
      active = false;
      observer.disconnect();
      wide.removeEventListener("change", update);
    };
    // The callers list what adds or removes notes.
  }, deps);
}
