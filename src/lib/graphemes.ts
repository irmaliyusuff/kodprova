// The reason field counts what the user sees as letters (grapheme clusters):
// a Turkish letter counts 1 and an emoji is never split (PRD K6).

export const REASON_LIMIT = 280;
/** From here on the counter is emphasised (design spec B13). */
export const REASON_WARNING_AT = 260;

const segmenters = new Map<string, Intl.Segmenter>();

function segmenter(locale: string): Intl.Segmenter {
  let found = segmenters.get(locale);
  if (!found) {
    found = new Intl.Segmenter(locale, { granularity: "grapheme" });
    segmenters.set(locale, found);
  }
  return found;
}

export function countGraphemes(text: string, locale: string): number {
  let count = 0;
  for (const _ of segmenter(locale).segment(text)) count++;
  return count;
}

/** The text cut to at most `max` graphemes; unchanged when it already fits. */
export function truncateGraphemes(
  text: string,
  max: number,
  locale: string,
): string {
  let count = 0;
  for (const { index } of segmenter(locale).segment(text)) {
    if (count === max) return text.slice(0, index);
    count++;
  }
  return text;
}
