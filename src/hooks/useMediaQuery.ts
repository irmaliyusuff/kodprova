import { useSyncExternalStore } from "react";

/** Whether a media query matches now; false while prerendering. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Notes move to the margin from this width (spec §1.5, T5). */
export const WIDE_SCREEN = "(min-width: 77.5rem)";
