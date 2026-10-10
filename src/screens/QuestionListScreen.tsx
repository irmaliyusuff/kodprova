// E2 Question list: a topic × difficulty table (four columns on wide
// screens). A solved question opens its result; an unsolved one opens the
// question (spec T13).

import { OriginLabel, OutcomeIcon } from "../components/markers.tsx";
import { questions, questionsIn } from "../data/questions.ts";
import type { QuestionSummary } from "../data/types.ts";
import { useLanguage } from "../i18n/language-context.tsx";
import { LANGUAGE_NAME_KEYS, TOPIC_KEYS } from "../i18n/keys.ts";
import type { Progress } from "../lib/progress.ts";
import { pathFor } from "../lib/routes.ts";
import { scoreAnswer } from "../lib/scoring.ts";
import { TOPICS } from "../../scripts/lib/question.ts";
import { Link } from "../router.tsx";
import { useAppState } from "../state/store.ts";

function QuestionCard({
  question,
  results,
}: {
  question: QuestionSummary;
  results: Progress["results"];
}) {
  const { lang, t } = useLanguage();
  const answer = results[question.id];
  const score = answer && scoreAnswer(question, answer);
  const route = score
    ? ({ name: "result", id: question.id } as const)
    : ({ name: "question", id: question.id } as const);
  return (
    <li>
      <Link className="soru-kart" to={pathFor(lang, route)}>
        <span className="kart-ust">
          <span>
            {t("liste.kart.no", { no: question.number })} ·{" "}
            {t("liste.kart.zorluk", { z: question.difficulty })}
          </span>
          <OriginLabel origin={question.origin} />
        </span>
        <span className="kart-baslik">{question.title[lang]}</span>
        <span className="kunye">
          <span>{t(LANGUAGE_NAME_KEYS[question.language])}</span>
          <span>{t("liste.kart.satir", { n: question.lineCount })}</span>
        </span>
        {score ? (
          <span className="kart-durum" data-bitti>
            <OutcomeIcon outcome="bitti" />{" "}
            {t("liste.kart.bitti", { b: score.found, t: score.total })}
          </span>
        ) : (
          <span className="kart-durum">{t("liste.kart.cozulmedi")}</span>
        )}
      </Link>
    </li>
  );
}

export function QuestionListScreen() {
  const { t } = useLanguage();
  const results = useAppState((state) => state.progress.results);
  const solvedCount = questions.filter(
    (question) => results[question.id],
  ).length;

  return (
    <>
      <div className="liste-bas">
        <h1 className="baslik">{t("liste.baslik")}</h1>
        <p className="alt-yazi">{t("liste.alt")}</p>
        <p className="cozulen">
          {t("liste.ozet", { c: solvedCount, "kunye.soru": questions.length })}
        </p>
        <nav className="konu-git" aria-label={t("liste.filtre.etiket")}>
          <span className="etiket" aria-hidden="true">
            {t("liste.filtre.etiket")}
          </span>
          {TOPICS.map((topic) => (
            <a key={topic} href={`#konu-${topic}`}>
              {t(TOPIC_KEYS[topic].name)}
            </a>
          ))}
        </nav>
      </div>
      <div className="matris">
        {TOPICS.map((topic) => (
          <section
            className="konu-sutun"
            id={`konu-${topic}`}
            aria-labelledby={`konu-${topic}-baslik`}
            key={topic}
          >
            <h2 id={`konu-${topic}-baslik`}>{t(TOPIC_KEYS[topic].name)}</h2>
            <p>{t(TOPIC_KEYS[topic].description)}</p>
            <ol>
              {questionsIn(topic).map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  results={results}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
