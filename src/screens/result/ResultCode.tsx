// The code again, now with the editor's marks (B18) and a note for every bug
// and false alarm (B19): found bugs get a solid bracket, missed ones a dashed
// one; the user's marks show whether they found something.

import { Fragment, useRef, type CSSProperties } from "react";
import { CodeScroller, CodeText } from "../../components/code.tsx";
import { CodeFacts } from "../../components/QuestionHeader.tsx";
import { useMarginNotes } from "../../components/useMarginNotes.ts";
import {
  OutcomeIcon,
  SeverityLabel,
  type Outcome,
} from "../../components/markers.tsx";
import { ExternalLink, InlineText, Warning } from "../../components/text.tsx";
import { config } from "../../config.ts";
import type { SiteBug, SiteQuestion } from "../../data/types.ts";
import { useLanguage } from "../../i18n/language-context.tsx";
import { SEVERITY_KEYS } from "../../i18n/keys.ts";
import { issueUrl } from "../../lib/issue-link.ts";
import {
  hasReason,
  type BugResult,
  type Score,
  type SubmittedMark,
} from "../../lib/scoring.ts";

function Quotes({ marks }: { marks: SubmittedMark[] }) {
  return marks.filter(hasReason).map((mark) => (
    <p className="alinti" key={mark.line}>
      {mark.reason}
    </p>
  ));
}

function BugNote({ result }: { result: BugResult<SiteBug> }) {
  const { lang, t } = useLanguage();
  const { bug, number, found, marks } = result;
  const [start, end] = bug.lines;
  const outcome: Outcome = found ? "bulundu" : "kacti";
  const severityName = t(SEVERITY_KEYS[bug.severity].name);
  return (
    <section
      className="not yeni"
      data-d={outcome}
      data-not-satir={start}
      aria-labelledby={`hata-${number}`}
    >
      {!found && (
        <span className="gizli">
          {t("sr.sonuc.kacti", {
            i: number,
            a: start,
            b: end,
            onem: severityName,
          })}
        </span>
      )}
      <p className="durum" data-d={outcome}>
        <OutcomeIcon outcome={outcome} />{" "}
        {t(found ? "durum.bulundu" : "durum.kacti")}
      </p>
      <h3 className="not-baslik" id={`hata-${number}`}>
        {start === end
          ? t("sonuc.hata.baslik.tek", { i: number, a: start })
          : t("sonuc.hata.baslik", { i: number, a: start, b: end })}
      </h3>
      <dl className="karsilastir">
        <dt>{t("sonuc.onem.senin")}</dt>
        <dd>
          {found ? (
            marks.map((mark) => (
              <Fragment key={mark.line}>
                <span>
                  <SeverityLabel severity={mark.severity} />
                </span>
                <span
                  className="esles"
                  data-farkli={mark.severity !== bug.severity || undefined}
                >
                  {t(
                    mark.severity === bug.severity
                      ? "sonuc.onem.esit"
                      : "sonuc.onem.farkli",
                  )}
                </span>
              </Fragment>
            ))
          ) : (
            <span className="isaretsiz">{t("sonuc.onem.yok")}</span>
          )}
        </dd>
        <dt>{t("sonuc.onem.dogru")}</dt>
        <dd>
          <SeverityLabel severity={bug.severity} />
        </dd>
      </dl>
      <p className="alt-baslik">{t("sonuc.aciklama.baslik")}</p>
      <p className="aciklama">
        <InlineText text={bug.explanation[lang]} />
      </p>
      {found && (
        <>
          <p className="alt-baslik">{t("sonuc.gerekce.baslik")}</p>
          {marks.some(hasReason) ? (
            <Quotes marks={marks} />
          ) : (
            <Warning>{t("sonuc.gerekce.bos")}</Warning>
          )}
        </>
      )}
    </section>
  );
}

/** A mark outside every bug; no "say it in the interview" warning here (N-06). */
function FalseAlarmNote({
  mark,
  question,
}: {
  mark: SubmittedMark;
  question: SiteQuestion;
}) {
  const { lang, t } = useLanguage();
  return (
    <section
      className="not yeni"
      data-d="yanlis"
      data-not-satir={mark.line}
      aria-labelledby={`alarm-${mark.line}`}
    >
      <p className="durum" data-d="yanlis">
        <OutcomeIcon outcome="yanlis" /> {t("durum.alarm")}
      </p>
      <h3 className="not-baslik" id={`alarm-${mark.line}`}>
        {t("sonuc.alarm.baslik", { n: mark.line })}
      </h3>
      <p className="aciklama">{t("sonuc.alarm.metin")}</p>
      <dl className="karsilastir">
        <dt>{t("sonuc.onem.senin")}</dt>
        <dd>
          <SeverityLabel severity={mark.severity} />
        </dd>
      </dl>
      {hasReason(mark) && (
        <>
          <p className="alt-baslik">{t("sonuc.gerekce.baslik")}</p>
          <Quotes marks={[mark]} />
        </>
      )}
      {config.repositoryUrl && (
        <p className="itiraz">
          <ExternalLink
            href={issueUrl(config.repositoryUrl, question.number, lang)}
          >
            {t("sonuc.alarm.itiraz")}
          </ExternalLink>
        </p>
      )}
    </section>
  );
}

interface LineState {
  /** The bracket next to the line number when the line is inside a bug. */
  range?: "bulundu" | "kacti";
  /** The user's mark on this line: it found a bug, or it was a false alarm. */
  mark?: { outcome: "bulundu" | "yanlis"; order: number; bugSeverity?: string };
}

function lineStates(
  score: Score<SiteBug>,
  severityName: (bug: BugResult<SiteBug>) => string,
) {
  const states = new Map<number, LineState>();
  const stateOf = (line: number) => {
    const existing = states.get(line);
    if (existing) return existing;
    const created: LineState = {};
    states.set(line, created);
    return created;
  };
  // Marks appear one after another on first draw, in this order (H6).
  let order = 0;
  for (const result of score.bugs) {
    const [start, end] = result.bug.lines;
    for (let line = start; line <= end; line++) {
      stateOf(line).range = result.found ? "bulundu" : "kacti";
    }
    for (const mark of result.marks) {
      stateOf(mark.line).mark = {
        outcome: "bulundu",
        order: order++,
        bugSeverity: severityName(result),
      };
    }
  }
  for (const mark of score.falseAlarms) {
    stateOf(mark.line).mark = { outcome: "yanlis", order: order++ };
  }
  return states;
}

export function ResultCode({
  question,
  score,
}: {
  question: SiteQuestion;
  score: Score<SiteBug>;
}) {
  const { t } = useLanguage();
  const section = useRef<HTMLElement>(null);
  useMarginNotes(section, [score]);
  const states = lineStates(score, (result) =>
    t(SEVERITY_KEYS[result.bug.severity].name),
  );

  return (
    <section
      className="kod-bolum sonuc"
      ref={section}
      aria-labelledby="kod-baslik"
    >
      <div className="kod-ust">
        <h2 id="kod-baslik">{t("soru.kod.baslik")}</h2>
        <CodeFacts question={question} />
      </div>
      <CodeScroller label={t("soru.kod.baslik")}>
        <div className="kod">
          {question.code.map((tokens, index) => {
            const line = index + 1;
            const { range, mark } = states.get(line) ?? {};
            return (
              <Fragment key={line}>
                <div
                  className="satir"
                  data-satir={line}
                  data-aralik={range}
                  data-d={mark?.outcome}
                  style={
                    mark
                      ? ({ "--sira": mark.order } as CSSProperties)
                      : undefined
                  }
                >
                  <span className="oluk">
                    <span className="no" aria-hidden="true">
                      {line}
                    </span>
                    {mark && (
                      <span className="gizli">
                        {mark.outcome === "bulundu"
                          ? t("sr.sonuc.bulundu", {
                              n: line,
                              onem: mark.bugSeverity ?? "",
                            })
                          : t("sr.sonuc.alarm", { n: line })}
                      </span>
                    )}
                  </span>
                  <CodeText line={tokens} />
                </div>
                {score.bugs
                  .filter((result) => result.bug.lines[1] === line)
                  .map((result) => (
                    <BugNote key={result.bug.id} result={result} />
                  ))}
                {score.falseAlarms
                  .filter((alarm) => alarm.line === line)
                  .map((alarm) => (
                    <FalseAlarmNote
                      key={`alarm-${line}`}
                      mark={alarm}
                      question={question}
                    />
                  ))}
              </Fragment>
            );
          })}
        </div>
      </CodeScroller>
    </section>
  );
}
