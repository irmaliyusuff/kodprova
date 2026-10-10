// Text helpers: question text with inline code, question titles, external
// links and the warning line (B20).

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useLanguage } from "../i18n/language-context.tsx";
import { splitHyphenatedWords } from "../lib/hyphenated-words.ts";
import { splitInlineCode } from "../lib/inline-code.ts";

/** Question text; `backtick` parts become <code>, nothing else is interpreted. */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {splitInlineCode(text).map((part, index) =>
        part.code ? <code key={index}>{part.text}</code> : part.text,
      )}
    </>
  );
}

/** Question title; a hyphenated word ("e-postası") is never split (spec v1.2). */
export function TitleText({ text }: { text: string }) {
  return (
    <>
      {splitHyphenatedWords(text).map((part, index) =>
        part.keepWhole ? (
          <span className="kirilmaz" key={index}>
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

/** Opens in a new tab, says so to screen readers, and shows ↗ (B6). */
export function ExternalLink({
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { t } = useLanguage();
  return (
    <a
      {...props}
      className={className ? `${className} dis` : "dis"}
      target="_blank"
      rel="noopener"
    >
      {children}
      <span className="gizli"> {t("ortak.yeniSekme")}</span>
    </a>
  );
}

/** A problem the user can fix, linked from its field with aria-describedby. */
export function Warning({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p className="uyari" id={id}>
      {children}
    </p>
  );
}
