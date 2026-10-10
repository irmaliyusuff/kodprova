// E5 Progress: per-topic counts, and a reset that asks first (PRD K13).

import { useRef, useState, type RefObject } from "react";
import { questions } from "../data/questions.ts";
import { useLanguage } from "../i18n/language-context.tsx";
import { TOPIC_KEYS } from "../i18n/keys.ts";
import { summarizeProgress, type TopicSummary } from "../lib/progress.ts";
import { firstToStart } from "../lib/question-order.ts";
import { pathFor } from "../lib/routes.ts";
import { Link } from "../router.tsx";
import { resetProgress, useAppState } from "../state/store.ts";

function Tally({ summary }: { summary: TopicSummary }) {
  return (
    <span className="cetele" aria-hidden="true">
      {summary.questions.map((question) => (
        <i
          key={question.id}
          data-dolu={summary.solved.includes(question) || undefined}
        />
      ))}
    </span>
  );
}

function ProgressTable({ rows }: { rows: TopicSummary[] }) {
  const { t } = useLanguage();
  const value = (x: number, y: number) => t("ilerleme.tablo.deger", { x, y });
  const sum = (pick: (row: TopicSummary) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);
  const solved = sum((row) => row.solved.length);
  return (
    <div className="tablo-kap">
      <table className="ilerleme-tablo">
        <thead>
          <tr>
            <th scope="col">{t("ilerleme.tablo.konu")}</th>
            <th scope="col">{t("ilerleme.tablo.cozulen")}</th>
            <th scope="col">{t("ilerleme.tablo.bulunan")}</th>
            <th scope="col">{t("ilerleme.tablo.test")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.topic}>
              <th scope="row">{t(TOPIC_KEYS[row.topic].name)}</th>
              <td>
                {value(row.solved.length, row.questions.length)}
                <Tally summary={row} />
              </td>
              <td>{value(row.bugsFound, row.bugsTotal)}</td>
              <td>{value(row.testsRight, row.solved.length)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{t("ilerleme.tablo.toplam")}</th>
            <td>{value(solved, questions.length)}</td>
            <td>
              {value(
                sum((row) => row.bugsFound),
                sum((row) => row.bugsTotal),
              )}
            </td>
            <td>
              {value(
                sum((row) => row.testsRight),
                solved,
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/**
 * B35: a native modal dialog. "Cancel" comes first and gets the focus; Esc
 * cancels; closing returns focus to the button that opened it.
 */
function ResetDialog({
  dialogRef,
  onConfirm,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();
  return (
    <dialog
      className="onay"
      ref={dialogRef}
      aria-labelledby="onay-baslik"
      aria-describedby="onay-metin"
    >
      <h2 id="onay-baslik">{t("ilerleme.onay.baslik")}</h2>
      <p id="onay-metin">{t("ilerleme.onay.metin")}</p>
      <div className="dugmeler">
        <button
          type="button"
          className="dugme ikincil"
          onClick={() => dialogRef.current?.close()}
        >
          {t("ilerleme.onay.hayir")}
        </button>
        <button type="button" className="dugme tehlike" onClick={onConfirm}>
          {t("ilerleme.onay.evet")}
        </button>
      </div>
    </dialog>
  );
}

export function ProgressScreen() {
  const { lang, t } = useLanguage();
  const storage = useAppState((state) => state.storage);
  const results = useAppState((state) => state.progress.results);
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const rows = summarizeProgress(questions, results);
  const solvedAny = rows.some((row) => row.solved.length > 0);

  const confirmReset = () => {
    resetProgress();
    setMessage(t("ilerleme.sifirlandi"));
    dialogRef.current?.close();
    // The reset button is gone now, so focus moves to the page itself.
    document.getElementById("icerik")?.focus();
  };

  let body;
  if (storage === "unavailable") {
    body = <p className="ilerleme-bilgi">{t("ilerleme.depolama")}</p>;
  } else if (!solvedAny) {
    body = (
      <div className="ilerleme-bilgi">
        <p>{t("ilerleme.bos")}</p>
        <Link
          className="dugme"
          to={pathFor(lang, {
            name: "question",
            id: firstToStart(questions, results).id,
          })}
        >
          {t("ilerleme.bos.dugme")} <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  } else {
    body = (
      <>
        <ProgressTable rows={rows} />
        <div className="ilerleme-alt">
          <button
            type="button"
            className="dugme ikincil"
            onClick={() => {
              dialogRef.current?.showModal();
              // "Cancel" is the safe default, whatever the browser would pick.
              dialogRef.current?.querySelector("button")?.focus();
            }}
          >
            {t("ilerleme.sifirla")}
          </button>
        </div>
        <ResetDialog dialogRef={dialogRef} onConfirm={confirmReset} />
      </>
    );
  }

  return (
    <>
      <div className="liste-bas">
        <h1 className="baslik">{t("ilerleme.baslik")}</h1>
        <p className="alt-yazi">{t("ilerleme.alt")}</p>
        <p className="durum-satiri" role="status">
          {message}
        </p>
      </div>
      {body}
    </>
  );
}
