// E1 Home: what this is, how it works, and one click to the first question.

import { ProofSample } from "../components/ProofSample.tsx";
import { OutcomeIcon } from "../components/markers.tsx";
import { SeverityScale } from "../components/SeverityScale.tsx";
import { questions } from "../data/questions.ts";
import { useLanguage } from "../i18n/language-context.tsx";
import { firstToStart } from "../lib/question-order.ts";
import { pathFor } from "../lib/routes.ts";
import { Link } from "../router.tsx";
import { useAppState } from "../state/store.ts";

const STEPS = [
  { title: "giris.adim.1.baslik", text: "giris.adim.1.metin" },
  { title: "giris.adim.2.baslik", text: "giris.adim.2.metin" },
  { title: "giris.adim.3.baslik", text: "giris.adim.3.metin" },
] as const;

/** The small picture above each step: handoff quote, circled line, results. */
function StepMark({ step }: { step: number }) {
  if (step === 0) return <span className="adim-tirnak">“</span>;
  if (step === 1) return <span className="no adim-halka">15</span>;
  return (
    <>
      <OutcomeIcon outcome="bulundu" />
      <OutcomeIcon outcome="kacti" />
      <OutcomeIcon outcome="yanlis" />
    </>
  );
}

export function HomeScreen() {
  const { lang, t } = useLanguage();
  const results = useAppState((state) => state.progress.results);
  const start = firstToStart(questions, results);

  return (
    <>
      <section className="giris-bas" aria-labelledby="giris-h1">
        <div>
          <span className="etiket">{t("giris.ust")}</span>
          <h1 id="giris-h1">{t("giris.h1")}</h1>
          <p className="tanim">{t("giris.tanim")}</p>
          <div className="eylem">
            <Link
              className="dugme"
              to={pathFor(lang, { name: "question", id: start.id })}
            >
              {t("giris.cta.birincil")} <span aria-hidden="true">→</span>
            </Link>
            <Link
              className="dugme ikincil"
              to={pathFor(lang, { name: "list" })}
            >
              {t("giris.cta.ikincil")}
            </Link>
          </div>
          <p className="kunye">
            {t("giris.kunye", { "kunye.soru": questions.length })}
          </p>
        </div>
        <ProofSample />
      </section>

      <section className="bolum-blok genis-blok" aria-labelledby="nasil-h2">
        <h2 className="bolum" id="nasil-h2">
          {t("giris.nasil.baslik")}
        </h2>
        <ol className="adimlar">
          {STEPS.map((step, index) => (
            <li className="adim" key={step.title}>
              <div className="isaret-ornek" aria-hidden="true">
                <StepMark step={index} />
              </div>
              <h3>{t(step.title)}</h3>
              <p>{t(step.text)}</p>
            </li>
          ))}
        </ol>
        <p className="giris-alt">
          <span>{t("giris.puanlama")}</span>
          <Link to={pathFor(lang, { name: "howItsMade" })}>
            {t("giris.baglanti.hazirlandi")}
          </Link>
        </p>
      </section>

      <section className="bolum-blok" aria-labelledby="onem-h2">
        <h2 className="bolum" id="onem-h2">
          {t("onem.baslik")}
        </h2>
        <SeverityScale />
      </section>
    </>
  );
}
