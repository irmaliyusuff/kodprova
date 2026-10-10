// The sections under the marked code on the Result screen: the test choice
// (B23), the sample interview answer with the user's reasons (B24) and the
// origin of the question (B26).

import { OriginLabel, OutcomeIcon } from "../../components/markers.tsx";
import { InlineText, Warning } from "../../components/text.tsx";
import type { SiteQuestion } from "../../data/types.ts";
import { useLanguage } from "../../i18n/language-context.tsx";
import { ORIGIN_KEYS, SEVERITY_KEYS } from "../../i18n/keys.ts";
import { pathFor } from "../../lib/routes.ts";
import {
  hasReason,
  isInRange,
  type SubmittedAnswer,
} from "../../lib/scoring.ts";
import { Link } from "../../router.tsx";
import { setChecklistItem, useAppState } from "../../state/store.ts";

/** Every option, so the user sees why the others would not catch the bug (T16). */
export function TestResult({
  question,
  choice,
}: {
  question: SiteQuestion;
  choice: string;
}) {
  const { lang, t } = useLanguage();
  return (
    <section className="bolum-blok" aria-labelledby="test-baslik">
      <h2 className="bolum" id="test-baslik">
        {t("sonuc.test.baslik")}
      </h2>
      <ul className="test-sonuc">
        {question.testQuestion.options.map((option) => {
          const right = option.id === question.testQuestion.correct;
          const chosen = option.id === choice;
          const labels = [
            right && t("sonuc.test.dogruEtiket"),
            chosen && t("sonuc.test.seninEtiket"),
          ].filter(Boolean);
          return (
            <li key={option.id} data-yok={(!right && !chosen) || undefined}>
              <OutcomeIcon
                outcome={right ? "bulundu" : chosen ? "yanlis" : null}
              />
              <div className="test-metin">
                <InlineText text={option.text[lang]} />
                {labels.length > 0 && (
                  <span className="etiket">{labels.join(" · ")}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="test-neden">{t("sonuc.test.neden")}</p>
    </section>
  );
}

/** The sample answer and checklist, with the user's own reasons beside them (K10). */
export function AnswerSection({
  question,
  answer,
}: {
  question: SiteQuestion;
  answer: SubmittedAnswer;
}) {
  const { lang, t } = useLanguage();
  const ticks = useAppState((state) => state.progress.checklists[question.id]);
  const foundBug = (line: number) =>
    question.bugs.some((bug) => isInRange(line, bug.lines));

  return (
    <section className="cevap izgara" aria-labelledby="ornek-baslik">
      <div>
        <h2 className="bolum" id="ornek-baslik">
          {t("sonuc.ornek.baslik")}
        </h2>
        <p className="alt-yazi">{t("sonuc.ornek.alt")}</p>
        <p className="ornek">
          <InlineText text={question.sampleAnswer[lang]} />
        </p>
        <div className="kontrol">
          <h3>{t("sonuc.kontrol.baslik")}</h3>
          <p className="alt-yazi">{t("sonuc.kontrol.alt")}</p>
          <ul>
            {question.checklist.map((item, index) => (
              <li key={index}>
                <label>
                  <input
                    type="checkbox"
                    checked={ticks?.[index] ?? false}
                    onChange={(event) =>
                      setChecklistItem(question.id, index, event.target.checked)
                    }
                  />
                  <span>
                    <InlineText text={item[lang]} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <aside className="kenarda" aria-labelledby="gerekce-baslik">
        <div className="gerekceler">
          <h3 className="etiket" id="gerekce-baslik">
            {t(
              answer.marks.length > 1
                ? "sonuc.gerekceler.baslik"
                : "sonuc.gerekce.baslik",
            )}
          </h3>
          <ul>
            {answer.marks.map((mark) => (
              <li key={mark.line}>
                <span className="etiket">
                  {t("isaret.baslik", { n: mark.line })} ·{" "}
                  {t(SEVERITY_KEYS[mark.severity].name)}
                </span>
                {hasReason(mark) ? (
                  <p>{mark.reason}</p>
                ) : (
                  // The interview warning is for marks that found a bug (K6, N-06).
                  foundBug(mark.line) && (
                    <Warning>{t("sonuc.gerekce.bos")}</Warning>
                  )
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}

export function OriginBlock({ question }: { question: SiteQuestion }) {
  const { lang, t } = useLanguage();
  return (
    <section className="koken-blok" aria-labelledby="koken-baslik">
      <h2 className="etiket" id="koken-baslik">
        {t("sonuc.koken.baslik")}
      </h2>
      <p>
        <OriginLabel origin={question.origin} />
      </p>
      <p>{t(ORIGIN_KEYS[question.origin].explanation)}</p>
      <p>
        <Link to={`${pathFor(lang, { name: "howItsMade" })}#koken`}>
          {t("sonuc.koken.baglanti")}
        </Link>
      </p>
    </section>
  );
}
