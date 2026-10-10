// B25: the fixed code as a diff against the original. Only the changed places
// with two lines of context; a removed line is struck through in ink, an
// added line has a green rule and "+". The strike is drawn once, when the
// diff scrolls into view (H8); with reduced motion, or without script, it is
// simply there.

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { CodeScroller, CodeText } from "../../components/code.tsx";
import { lineText, type SiteQuestion } from "../../data/types.ts";
import { useLanguage } from "../../i18n/language-context.tsx";
import { diffHunks, diffLines, type DiffKind } from "../../lib/line-diff.ts";

const SIGN: Record<DiffKind, string> = { same: " ", removed: "-", added: "+" };
const VISIBLE_SIGN: Record<DiffKind, string> = {
  same: "",
  removed: "−",
  added: "+",
};

function useDrawWhenVisible() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"static" | "waiting" | "drawing">(
    "static",
  );

  useEffect(() => {
    const target = ref.current;
    if (
      !target ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    setPhase("waiting");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setPhase("drawing");
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const className = { static: "", waiting: " bekle", drawing: " ciz" }[phase];
  return { ref, className };
}

export function FixDiff({ question }: { question: SiteQuestion }) {
  const { t } = useLanguage();
  const draw = useDrawWhenVisible();
  const hunks = diffHunks(
    diffLines(question.code.map(lineText), question.fixedCode.map(lineText)),
  );
  let removedCount = 0;

  return (
    <section
      className="bolum-blok genis-blok"
      aria-labelledby="duzeltme-baslik"
    >
      <h2 className="bolum" id="duzeltme-baslik">
        {t("sonuc.duzeltme.baslik")}
      </h2>
      <p className="alt-yazi">{t("sonuc.duzeltme.not")}</p>
      <CodeScroller label={t("sonuc.duzeltme.baslik")} className="fark-kap">
        <div className={`kod fark${draw.className}`} ref={draw.ref}>
          {hunks.map((hunk, index) => (
            <Fragment key={index}>
              {index > 0 && (
                <div className="atlanan" aria-hidden="true">
                  ⋯
                </div>
              )}
              {hunk.map(({ kind, oldNumber, newNumber }) => {
                const tokens =
                  kind === "added"
                    ? question.fixedCode[newNumber! - 1]!
                    : question.code[oldNumber! - 1]!;
                const style =
                  kind === "removed"
                    ? ({ "--sira": removedCount++ } as CSSProperties)
                    : undefined;
                return (
                  <div
                    className="satir"
                    data-t={SIGN[kind]}
                    style={style}
                    key={`${oldNumber}-${newNumber}`}
                  >
                    <span className="oluk">
                      <b>{oldNumber}</b>
                      <b>{newNumber}</b>
                    </span>
                    <span className="isaretci" aria-hidden="true">
                      {VISIBLE_SIGN[kind]}
                    </span>
                    <CodeText line={tokens} />
                    {kind !== "same" && (
                      <span className="gizli">{t("sr.duzeltme.degisen")}</span>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </CodeScroller>
    </section>
  );
}
