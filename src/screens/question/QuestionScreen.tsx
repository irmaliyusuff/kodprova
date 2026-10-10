// E3 Question: read the task, the code and the handoff note; mark lines, give
// each mark a severity and a reason; pick the test; submit (PRD K4–K7).

import { useEffect, useRef, useState } from "react";
import { SeverityScale } from "../../components/SeverityScale.tsx";
import {
  Breadcrumb,
  CodeFacts,
  QuestionFacts,
  TaskSheet,
} from "../../components/QuestionHeader.tsx";
import { useMarginNotes } from "../../components/useMarginNotes.ts";
import { TitleText, Warning } from "../../components/text.tsx";
import type { SiteQuestion } from "../../data/types.ts";
import { useMediaQuery, WIDE_SCREEN } from "../../hooks/useMediaQuery.ts";
import { useLanguage } from "../../i18n/language-context.tsx";
import { findBlocker, type Blocker } from "../../lib/marks.ts";
import { pathFor } from "../../lib/routes.ts";
import { Link, useRouter } from "../../router.tsx";
import {
  draftOf,
  setReason,
  setSeverity,
  setTestChoice,
  submitAnswer,
  toggleMark,
  useAppState,
} from "../../state/store.ts";
import { MarkNote } from "./MarkNote.tsx";
import {
  lineButtonSelector,
  markableLines,
  QuestionCode,
} from "./QuestionCode.tsx";
import { TestPicker } from "./TestPicker.tsx";

const SUBMIT_REASON_ID = "gonder-neden";

function useBlockerText(blocker: Blocker | null): string {
  const { t } = useLanguage();
  switch (blocker?.kind) {
    case "noMarks":
      return t("gonder.engel.isaret");
    case "noSeverity":
      return t("gonder.engel.onem", { n: blocker.line });
    case "noTest":
      return t("gonder.engel.test");
    default:
      return "";
  }
}

export function QuestionScreen({ question }: { question: SiteQuestion }) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const draft = useAppState((state) => draftOf(state, question.id));
  const solved = useAppState((state) =>
    Boolean(state.progress.results[question.id]),
  );
  const wide = useMediaQuery(WIDE_SCREEN);

  const [focusLine, setFocusLine] = useState(
    () => draft.marks[0]?.line ?? markableLines(question.code)[0] ?? 1,
  );
  /** Narrow screens show one open note: the newest or the one tapped. */
  const [openLine, setOpenLine] = useState<number | null>(null);
  const [newLine, setNewLine] = useState<number | null>(null);
  /** The note with focus or under the pointer; its line is shaded. */
  const [noteInUse, setNoteInUse] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [severityErrorLine, setSeverityErrorLine] = useState<number | null>(
    null,
  );
  const [testError, setTestError] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [overflowing, setOverflowing] = useState(false);

  const codeSection = useRef<HTMLElement>(null);
  const focusAfterRender = useRef<string | null>(null);
  const submitting = useRef(false);

  const blocker = findBlocker(draft);
  const blockerText = useBlockerText(blocker);

  useMarginNotes(codeSection, [draft.marks.map((mark) => mark.line).join()]);

  useEffect(() => {
    if (!focusAfterRender.current) return;
    document.querySelector<HTMLElement>(focusAfterRender.current)?.focus();
    focusAfterRender.current = null;
  });

  const focusLineButton = (line: number) => {
    setFocusLine(line);
    document
      .querySelector<HTMLElement>(lineButtonSelector(line))
      ?.focus({ preventScroll: true });
  };

  const toggle = (line: number) => {
    const count = draft.marks.length;
    const result = toggleMark(question.id, line);
    focusLineButton(line);
    if (result === "limit") {
      setLimitReached(true);
      return;
    }
    setLimitReached(false);
    if (result === "added") {
      setOpenLine(line);
      setNewLine(line);
      setAnnouncement(t("sr.isaret.eklendi", { n: line, m: count + 1 }));
    } else {
      if (openLine === line) setOpenLine(null);
      if (severityErrorLine === line) setSeverityErrorLine(null);
      setAnnouncement(t("sr.isaret.kaldirildi", { n: line, m: count - 1 }));
    }
  };

  const openNote = (line: number) => {
    setOpenLine(line);
    focusAfterRender.current = `[data-not-satir="${line}"] input:checked, [data-not-satir="${line}"] input`;
  };

  const submit = () => {
    if (submitting.current) return;
    if (!blocker) {
      submitting.current = true;
      submitAnswer(question, lang);
      router.navigate(pathFor(lang, { name: "result", id: question.id }));
      return;
    }
    // The button explains what is missing; pressing it goes there (spec §9.4).
    if (blocker.kind === "noMarks") {
      focusLineButton(focusLine);
    } else if (blocker.kind === "noSeverity") {
      setSeverityErrorLine(blocker.line);
      openNote(blocker.line);
    } else {
      setTestError(true);
      focusAfterRender.current = ".test-sec input";
    }
  };

  const activeLine = noteInUse ?? (wide ? null : openLine);

  return (
    <>
      <Breadcrumb question={question} />
      {solved && (
        <div className="serit">
          <p>{t("soru.cozuldu.not")}</p>
          <Link
            className="dugme ikincil kucuk"
            to={pathFor(lang, { name: "result", id: question.id })}
          >
            {t("soru.cozuldu.gor")}
          </Link>
        </div>
      )}
      <p className="durum-satiri" role="status">
        {router.state.restarted ? t("soru.bastan.not") : ""}
      </p>
      <h1 className="baslik">
        <TitleText text={question.title[lang]} />
      </h1>
      <QuestionFacts question={question} />
      <TaskSheet question={question} />

      <section
        className="kod-bolum"
        ref={codeSection}
        aria-labelledby="kod-baslik"
      >
        <div className="kod-ust">
          <h2 id="kod-baslik">{t("soru.kod.baslik")}</h2>
          <CodeFacts question={question} />
        </div>
        <div className="kenar-bas">
          <p className="yonerge">{t("soru.yonerge")}</p>
          <p className="ipucu">{t("soru.ipucu")}</p>
          <div className="sayac-satiri">
            <strong>{t("soru.sayac", { n: draft.marks.length })}</strong>
            <details className="yardim">
              <summary>{t("isaret.onem.yardim")}</summary>
              <SeverityScale />
            </details>
          </div>
          <p className="not-alti">{t("isaret.gerekce.not")}</p>
          <div role="status">
            {limitReached && <Warning>{t("isaret.hata.limit")}</Warning>}
          </div>
          <p className="gizli" aria-live="polite">
            {announcement}
          </p>
        </div>
        {overflowing && <p className="kaydir-ipucu">{t("soru.kaydir")}</p>}
        <QuestionCode
          code={question.code}
          marks={draft.marks}
          focusLine={focusLine}
          activeLine={activeLine}
          onToggle={toggle}
          onFocusLine={setFocusLine}
          onOverflowChange={setOverflowing}
          renderNote={(mark) => (
            <MarkNote
              key={`not-${mark.line}`}
              mark={mark}
              collapsed={openLine !== mark.line}
              isNew={newLine === mark.line}
              showSeverityError={severityErrorLine === mark.line}
              onOpen={() => openNote(mark.line)}
              onRemove={() => toggle(mark.line)}
              onSeverity={(severity) => {
                setSeverity(question.id, mark.line, severity);
                if (severityErrorLine === mark.line) setSeverityErrorLine(null);
              }}
              onReason={(reason) => setReason(question.id, mark.line, reason)}
              onInUse={(inUse) => setNoteInUse(inUse ? mark.line : null)}
            />
          )}
        />
      </section>

      <section className="bolum-blok" aria-labelledby="test-baslik">
        <h2 className="bolum" id="test-baslik">
          {t("test.baslik")}
        </h2>
        <p className="alt-yazi">{t("test.yardim")}</p>
        <TestPicker
          question={question}
          choice={draft.testChoice}
          showError={testError}
          onChoose={(optionId) => {
            setTestChoice(question.id, optionId);
            setTestError(false);
          }}
        />
        <div className="gonder">
          <button
            type="button"
            className="dugme"
            aria-disabled={blocker ? "true" : undefined}
            aria-describedby={blocker ? SUBMIT_REASON_ID : undefined}
            onClick={submit}
          >
            {t("soru.gonder")}
          </button>
          {blocker && (
            <span className="neden" id={SUBMIT_REASON_ID}>
              {blockerText}
            </span>
          )}
        </div>
      </section>
    </>
  );
}
