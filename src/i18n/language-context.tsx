import { createContext, useContext, useMemo, type ReactNode } from "react";
import { translator, type Lang, type Translate } from "./translate.ts";

interface LanguageValue {
  lang: Lang;
  t: Translate;
}

const LanguageContext = createContext<LanguageValue | null>(null);

/** The interface language comes from the address; this passes it down. */
export function LanguageProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ lang, t: translator(lang) }), [lang]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage needs a <LanguageProvider>");
  return value;
}
