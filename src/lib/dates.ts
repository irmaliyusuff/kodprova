// Dates in the interface: "26 Ekim 2026" in Turkish, "October 26, 2026" in
// English (copy deck, {veri.tarih}).

import type { Lang } from "../i18n/translate.ts";

const LOCALES = { tr: "tr-TR", en: "en-US" } as const;

/** A YYYY-MM-DD day, written out; read as UTC so no time zone shifts it. */
export function formatDay(lang: Lang, day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`Not a day: ${day}`);
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}
