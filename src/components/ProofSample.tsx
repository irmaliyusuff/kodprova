// B31: a schematic code page that shows the product's one action, circling a
// line and writing a margin note. Bars stand in for code on purpose: a real
// question here would give its answer away. Decorative (aria-hidden).

import { Fragment } from "react";
import { useLanguage } from "../i18n/language-context.tsx";
import { SEVERITY_KEYS, SEVERITY_ORDER } from "../i18n/keys.ts";
import { SeverityNotch } from "./markers.tsx";

const FIRST_LINE = 12;
const MARKED_LINE = 15;
/** Bar lengths in % of the line, as drawn in the design (38–70 %). */
const BARS = [62, 48, 70, 54, 38, 66, 44];

export function ProofSample() {
  const { t } = useLanguage();
  const note = (
    <div className="p-not">
      <strong>{t("isaret.baslik", { n: MARKED_LINE })}</strong>
      <div className="p-onem">
        {SEVERITY_ORDER.map((severity) => (
          <span key={severity} data-secili={severity === "major" || undefined}>
            <SeverityNotch severity={severity} />{" "}
            {t(SEVERITY_KEYS[severity].name)}
          </span>
        ))}
      </div>
      <div className="p-gerekce">{t("isaret.gerekce.ipucu")}</div>
    </div>
  );
  return (
    <figure className="prova prova-giris" aria-hidden="true">
      {BARS.map((width, index) => {
        const line = FIRST_LINE + index;
        const marked = line === MARKED_LINE;
        return (
          <Fragment key={line}>
            <div className="p-satir" data-isaretli={marked || undefined}>
              <span className="p-no">
                <span>{line}</span>
              </span>
              <span className="p-cubuk" style={{ width: `${width}%` }} />
            </div>
            {marked && note}
          </Fragment>
        );
      })}
    </figure>
  );
}
