// The top of the Question and Result screens: breadcrumb (B7), the facts line
// (B8) and the work order with the task and the AI's handoff note (B16).

import type { QuestionSummary, SiteQuestion } from "../data/types.ts";
import { useLanguage } from "../i18n/language-context.tsx";
import { LANGUAGE_NAME_KEYS, TOPIC_KEYS } from "../i18n/keys.ts";
import { pathFor } from "../lib/routes.ts";
import { Link } from "../router.tsx";
import { OriginLabel } from "./markers.tsx";
import { InlineText } from "./text.tsx";

/** Questions › topic › Question 9. Built from parts: topic names contain "/". */
export function Breadcrumb({ question }: { question: QuestionSummary }) {
  const { lang, t } = useLanguage();
  return (
    <nav className="yol" aria-label={t("liste.baslik")}>
      <ol>
        <li>
          <Link to={pathFor(lang, { name: "list" })}>
            {t("ortak.menu.sorular")}
          </Link>
        </li>
        <li>{t(TOPIC_KEYS[question.topic].name)}</li>
        <li aria-current="page">
          {t("liste.kart.no", { no: question.number })}
        </li>
      </ol>
    </nav>
  );
}

/** "Web / frontend · Difficulty 3/5 · TypeScript · 45 lines" and the origin. */
export function QuestionFacts({ question }: { question: QuestionSummary }) {
  const { t } = useLanguage();
  return (
    <p className="kunye soru-kunye">
      <span>
        {t("soru.kunye", {
          konu: t(TOPIC_KEYS[question.topic].name),
          z: question.difficulty,
          dil: t(LANGUAGE_NAME_KEYS[question.language]),
          n: question.lineCount,
        })}
      </span>
      <OriginLabel origin={question.origin} />
    </p>
  );
}

/** "TypeScript · 45 lines" above the code. */
export function CodeFacts({ question }: { question: QuestionSummary }) {
  const { t } = useLanguage();
  return (
    <span className="kunye">
      <span>{t(LANGUAGE_NAME_KEYS[question.language])}</span>
      <span>{t("liste.kart.satir", { n: question.lineCount })}</span>
    </span>
  );
}

/**
 * B16: the task in the main column, the handoff note in the margin. The AI's
 * voice is set apart only by the quotation marks and the margin position.
 */
export function TaskSheet({ question }: { question: SiteQuestion }) {
  const { lang, t } = useLanguage();
  return (
    <div className="fis">
      <section className="gorev" aria-labelledby="gorev-baslik">
        <h2 id="gorev-baslik">{t("soru.gorev.baslik")}</h2>
        <p className="alt-yazi">{t("soru.gorev.alt")}</p>
        <p className="okuma">
          <InlineText text={question.task[lang]} />
        </p>
      </section>
      <section className="teslim" aria-labelledby="teslim-baslik">
        <h2 id="teslim-baslik">{t("soru.not.baslik")}</h2>
        <p className="alt-yazi">{t("soru.not.alt")}</p>
        <p className="okuma">
          “<InlineText text={question.deliveryNote[lang]} />”
        </p>
      </section>
    </div>
  );
}
