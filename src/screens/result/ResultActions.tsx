// B28: where to go next, "Solve again", the list, and "Report a problem".

import { ExternalLink } from "../../components/text.tsx";
import { config } from "../../config.ts";
import { questions } from "../../data/questions.ts";
import type { QuestionSummary } from "../../data/types.ts";
import { useLanguage } from "../../i18n/language-context.tsx";
import { TOPIC_KEYS } from "../../i18n/keys.ts";
import { issueUrl } from "../../lib/issue-link.ts";
import { nextStep } from "../../lib/question-order.ts";
import { pathFor } from "../../lib/routes.ts";
import { Link, useRouter } from "../../router.tsx";
import { clearDraft, useAppState } from "../../state/store.ts";

const Arrow = () => <span aria-hidden="true">→</span>;

export function ResultActions({ question }: { question: QuestionSummary }) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const results = useAppState((state) => state.progress.results);
  const step = nextStep(question, questions, results);
  /** A solved question opens on its result, an unsolved one on the question. */
  const openPath = (target: QuestionSummary) =>
    pathFor(lang, {
      name: results[target.id] ? "result" : "question",
      id: target.id,
    });

  let note: string | null = null;
  let primary;
  if (step.kind === "allDone") {
    note = t("sonuc.hepsi");
    primary = (
      <Link className="dugme" to={pathFor(lang, { name: "progress" })}>
        {t("sonuc.hepsi.dugme")} <Arrow />
      </Link>
    );
  } else if (step.kind === "nextTopic") {
    note = t("sonuc.konuSonu");
    primary = (
      <Link className="dugme" to={openPath(step.question)}>
        {t("sonuc.sonrakiKonu", { konu: t(TOPIC_KEYS[step.topic].name) })}{" "}
        <Arrow />
      </Link>
    );
  } else {
    primary = (
      <Link className="dugme" to={openPath(step.question)}>
        {t("sonuc.sonraki")} <Arrow />
      </Link>
    );
  }

  const solveAgain = () => {
    clearDraft(question.id);
    router.navigate(pathFor(lang, { name: "question", id: question.id }), {
      state: { restarted: true },
    });
  };

  return (
    <>
      {note && <p className="konu-sonu">{note}</p>}
      <div className="eylemler">
        {primary}
        <button type="button" className="dugme ikincil" onClick={solveAgain}>
          {t("soru.bastan")}
        </button>
        <Link className="dugme ikincil" to={pathFor(lang, { name: "list" })}>
          {t("sonuc.liste")}
        </Link>
        {config.repositoryUrl && (
          <ExternalLink
            className="metin-dugme sorun"
            href={issueUrl(config.repositoryUrl, question.number, lang)}
          >
            {t("sorun.baglanti")}
          </ExternalLink>
        )}
      </div>
      {config.repositoryUrl && <p className="sorun-not">{t("sorun.not")}</p>}
    </>
  );
}
