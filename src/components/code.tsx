// Code display shared by the Question and Result screens (B9): the scrolling
// code box and the coloured text of one line.

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CodeLine, SyntaxRole } from "../data/types.ts";

const ROLE_CLASS: Record<SyntaxRole, string> = {
  keyword: "s-anahtar",
  string: "s-dize",
  number: "s-sayi",
  function: "s-islev",
  type: "s-tip",
  comment: "s-yorum",
};

/**
 * One line of code. <pre> keeps the spaces exactly, also in the prerendered
 * HTML before any script runs.
 */
export function CodeText({ line }: { line: CodeLine }) {
  return (
    <pre className="kod-metin">
      <code>
        {line.map(([text, role], index) =>
          role ? (
            <span key={index} className={ROLE_CLASS[role]}>
              {text}
            </span>
          ) : (
            text
          ),
        )}
      </code>
    </pre>
  );
}

/**
 * The code box scrolls sideways on its own; the page never does (K4). When
 * the code is wider than the box, the box becomes a tab stop so it can be
 * scrolled with the keyboard (QA T-15); otherwise it is not one.
 */
export function CodeScroller({
  label,
  className,
  onOverflowChange,
  children,
}: {
  label: string;
  className?: string;
  onOverflowChange?: (overflowing: boolean) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const measure = () => setOverflowing(box.scrollWidth > box.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => onOverflowChange?.(overflowing),
    [overflowing, onOverflowChange],
  );

  return (
    <div
      ref={ref}
      className={className ? `kod-kap ${className}` : "kod-kap"}
      role="group"
      aria-label={label}
      tabIndex={overflowing ? 0 : undefined}
    >
      {children}
    </div>
  );
}
