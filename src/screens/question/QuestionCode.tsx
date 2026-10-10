// The code to review (B9) with its marks and notes. A whole line is the click
// or tap target; the line number is a button for keyboards and screen
// readers. Only one line button is a tab stop at a time: ↑ ↓ move between
// lines, Home / End jump, Enter or Space marks (spec §9.1, "roving tabindex").

import { Fragment, type KeyboardEvent, type ReactNode } from "react";
import { CodeScroller, CodeText } from "../../components/code.tsx";
import { lineText, type CodeLine } from "../../data/types.ts";
import { useLanguage } from "../../i18n/language-context.tsx";
import type { DraftMark } from "../../lib/marks.ts";

export const lineButtonSelector = (line: number) =>
  `[data-satir-dugme="${line}"]`;

interface QuestionCodeProps {
  code: CodeLine[];
  marks: DraftMark[];
  /** The line button that is the tab stop. */
  focusLine: number;
  /** The line whose note is open or in focus (shaded). */
  activeLine: number | null;
  onToggle: (line: number) => void;
  onFocusLine: (line: number) => void;
  onOverflowChange: (overflowing: boolean) => void;
  renderNote: (mark: DraftMark) => ReactNode;
}

/** Line numbers of the lines that have code; empty lines cannot be marked. */
export const markableLines = (code: CodeLine[]) =>
  code.flatMap((line, index) =>
    lineText(line).trim() === "" ? [] : [index + 1],
  );

export function QuestionCode(props: QuestionCodeProps) {
  const { code, marks, focusLine, activeLine } = props;
  const { t } = useLanguage();
  const markable = markableLines(code);

  const lineAfterKey = (key: string, line: number) => {
    const index = markable.indexOf(line);
    switch (key) {
      case "ArrowDown":
        return markable[index + 1] ?? line;
      case "ArrowUp":
        return markable[index - 1] ?? line;
      case "Home":
        return markable[0] ?? line;
      case "End":
        return markable.at(-1) ?? line;
      default:
        return null;
    }
  };

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, line: number) => {
    const target = lineAfterKey(event.key, line);
    if (target === null) return;
    event.preventDefault();
    props.onFocusLine(target);
    const button = document.querySelector<HTMLElement>(
      lineButtonSelector(target),
    );
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const onLineClick = (line: number) => {
    // Selecting code to copy it is not a click on the line.
    if (!window.getSelection()?.isCollapsed) return;
    props.onToggle(line);
  };

  return (
    <CodeScroller
      label={t("soru.kod.baslik")}
      onOverflowChange={props.onOverflowChange}
    >
      <div className="kod">
        {code.map((tokens, index) => {
          const line = index + 1;
          const mark = marks.find((m) => m.line === line);
          const canMark = markable.includes(line);
          return (
            <Fragment key={line}>
              <div
                className="satir"
                data-satir={line}
                data-tikla={canMark || undefined}
                data-isaretli={mark ? true : undefined}
                data-aktif={activeLine === line || undefined}
                onClick={canMark ? () => onLineClick(line) : undefined}
              >
                <span className="oluk">
                  {canMark ? (
                    <button
                      type="button"
                      className="no"
                      data-satir-dugme={line}
                      aria-pressed={mark ? "true" : "false"}
                      aria-label={t("sr.satir", { n: line })}
                      tabIndex={line === focusLine ? 0 : -1}
                      onKeyDown={(event) => moveFocus(event, line)}
                      onFocus={() => props.onFocusLine(line)}
                    >
                      {line}
                    </button>
                  ) : (
                    <span className="no">{line}</span>
                  )}
                </span>
                <CodeText line={tokens} />
              </div>
              {mark && props.renderNote(mark)}
            </Fragment>
          );
        })}
      </div>
    </CodeScroller>
  );
}
