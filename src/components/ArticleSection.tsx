// One section of an article page (How it's made, Data): a heading, reading
// text and an optional margin note (B33).

import type { ReactElement, ReactNode } from "react";
import { useLanguage } from "../i18n/language-context.tsx";
import type { MessageKey } from "../i18n/messages.ts";
import type { Params } from "../i18n/translate.ts";

interface SectionProps {
  id: string;
  title: MessageKey;
  /**
   * The reading text in order: a message key becomes a paragraph, an element
   * (with its own key) is placed as it is, false is left out.
   */
  paragraphs: (MessageKey | ReactElement | false)[];
  /** Slot values for the paragraphs' messages. */
  params?: Params;
  margin?: ReactNode;
  children?: ReactNode;
}

export function ArticleSection({
  id,
  title,
  paragraphs,
  params,
  margin,
  children,
}: SectionProps) {
  const { t } = useLanguage();
  return (
    <section
      className="makale-bolum izgara"
      id={id}
      aria-labelledby={`${id}-baslik`}
    >
      <div>
        <h2 id={`${id}-baslik`}>{t(title)}</h2>
        <div className="okuma">
          {paragraphs.map((item) =>
            typeof item === "string" ? (
              <p key={item}>{t(item, params)}</p>
            ) : (
              item
            ),
          )}
        </div>
        {children}
      </div>
      {margin && <aside className="kenar-not kenarda">{margin}</aside>}
    </section>
  );
}
