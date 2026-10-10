// B11: the note for one marked line: severity (required), reason (optional)
// and "Remove mark". On narrow screens only one note is open at a time; the
// others collapse to a one-line summary that opens them again (B11a).

import { SeverityLabel } from "../../components/markers.tsx";
import { Warning } from "../../components/text.tsx";
import type { Severity } from "../../data/types.ts";
import { useLanguage } from "../../i18n/language-context.tsx";
import { SEVERITY_KEYS, SEVERITY_ORDER } from "../../i18n/keys.ts";
import {
  countGraphemes,
  REASON_LIMIT,
  REASON_WARNING_AT,
  truncateGraphemes,
} from "../../lib/graphemes.ts";
import type { DraftMark } from "../../lib/marks.ts";

interface MarkNoteProps {
  mark: DraftMark;
  /** Narrow screens: collapsed to its summary. */
  collapsed: boolean;
  /** Just added: plays the entrance once. */
  isNew: boolean;
  showSeverityError: boolean;
  onOpen: () => void;
  onRemove: () => void;
  onSeverity: (severity: Severity) => void;
  onReason: (reason: string) => void;
  /** The note gained or lost focus or the pointer (its line is shaded meanwhile). */
  onInUse: (inUse: boolean) => void;
}

export const noteId = (line: number) => `not-${line}`;

function SeverityPicker({
  mark,
  showError,
  onSeverity,
}: Pick<MarkNoteProps, "mark" | "onSeverity"> & { showError: boolean }) {
  const { t } = useLanguage();
  const id = noteId(mark.line);
  return (
    <>
      <fieldset
        className="onem-sec"
        aria-labelledby={`${id}-baslik ${id}-onem`}
        aria-describedby={showError ? `${id}-hata` : undefined}
      >
        <legend id={`${id}-onem`}>{t("isaret.onem.etiket")}</legend>
        <div className="secenekler3">
          {SEVERITY_ORDER.map((severity) => (
            <label
              key={severity}
              data-secili={mark.severity === severity || undefined}
            >
              <input
                type="radio"
                name={`onem-${mark.line}`}
                value={severity}
                checked={mark.severity === severity}
                onChange={() => onSeverity(severity)}
              />
              <SeverityLabel severity={severity} />
            </label>
          ))}
        </div>
      </fieldset>
      {mark.severity && (
        <p className="onem-tanim">
          {t(SEVERITY_KEYS[mark.severity].definition)}
        </p>
      )}
      {showError && (
        <Warning id={`${id}-hata`}>{t("isaret.hata.onem")}</Warning>
      )}
    </>
  );
}

function ReasonField({
  mark,
  onReason,
}: Pick<MarkNoteProps, "mark" | "onReason">) {
  const { lang, t } = useLanguage();
  const id = noteId(mark.line);
  const count = countGraphemes(mark.reason, lang);
  return (
    <div className="gerekce">
      <label id={`${id}-gerekce-etiket`} htmlFor={`${id}-gerekce`}>
        {t("isaret.gerekce.etiket")}
      </label>
      <textarea
        id={`${id}-gerekce`}
        rows={2}
        value={mark.reason}
        placeholder={t("isaret.gerekce.ipucu")}
        aria-labelledby={`${id}-baslik ${id}-gerekce-etiket`}
        aria-describedby={`${id}-sayac`}
        // Typing stops at the limit and a longer paste is cut to it (K6).
        onChange={(event) =>
          onReason(truncateGraphemes(event.target.value, REASON_LIMIT, lang))
        }
      />
      <span
        className="karakter"
        id={`${id}-sayac`}
        data-sinir={count >= REASON_WARNING_AT || undefined}
      >
        {t("isaret.gerekce.sayac", { n: count })}
      </span>
    </div>
  );
}

export function MarkNote(props: MarkNoteProps) {
  const { mark, collapsed, isNew, onOpen, onRemove, onInUse } = props;
  const { t } = useLanguage();
  const id = noteId(mark.line);
  const title = t("isaret.baslik", { n: mark.line });
  return (
    <section
      className={isNew ? "not yeni" : "not"}
      data-not-satir={mark.line}
      data-kapali={collapsed || undefined}
      aria-labelledby={`${id}-baslik`}
      onFocus={() => onInUse(true)}
      onBlur={() => onInUse(false)}
      onMouseEnter={() => onInUse(true)}
      onMouseLeave={() => onInUse(false)}
    >
      <button
        type="button"
        className="not-ozet"
        aria-expanded="false"
        onClick={onOpen}
      >
        <strong>{title}</strong>
        {mark.severity ? (
          <>
            <SeverityLabel severity={mark.severity} />
            <span className="ozet-metin">{mark.reason}</span>
          </>
        ) : (
          <span className="ozet-metin ozet-eksik">{t("isaret.hata.onem")}</span>
        )}
      </button>
      <div className="not-ust">
        <h3 id={`${id}-baslik`}>{title}</h3>
        <button type="button" className="metin-dugme soluk" onClick={onRemove}>
          {t("isaret.kaldir")}
        </button>
      </div>
      <SeverityPicker
        mark={mark}
        showError={props.showSeverityError}
        onSeverity={props.onSeverity}
      />
      <ReasonField mark={mark} onReason={props.onReason} />
    </section>
  );
}
