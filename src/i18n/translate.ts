import { messages, type MessageKey } from "./messages.ts";

export const LANGUAGES = ["tr", "en"] as const;
export type Lang = (typeof LANGUAGES)[number];

export const isLang = (value: unknown): value is Lang =>
  LANGUAGES.includes(value as Lang);

/** The product name fills the copy deck's {urun.ad} slot in both languages. */
export const PRODUCT_NAME = "Kodprova";

export type Params = Record<string, string | number>;

/**
 * The message in the given language with its {slot}s filled in. A slot
 * without a value is a programming error, so it throws instead of showing
 * "{n}" to the user; the build renders every screen and would stop on it.
 */
export function translate(lang: Lang, key: MessageKey, params: Params = {}) {
  const values: Params = { "urun.ad": PRODUCT_NAME, ...params };
  return messages[key][lang].replace(/\{([\w.]+)\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) {
      throw new Error(`Message "${key}" needs a value for {${name}}`);
    }
    return String(value);
  });
}

export type Translate = (key: MessageKey, params?: Params) => string;

export const translator =
  (lang: Lang): Translate =>
  (key, params) =>
    translate(lang, key, params);
