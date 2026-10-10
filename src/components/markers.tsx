// Small markers that pair a shape with text: result symbols (B19a), severity
// notches (B21) and the origin label (B8). Shape and colour only support the
// words; they are hidden from screen readers.

import type { Origin, Severity } from "../data/types.ts";
import { useLanguage } from "../i18n/language-context.tsx";
import { ORIGIN_KEYS, SEVERITY_KEYS } from "../i18n/keys.ts";
import { Icon, type IconName } from "./Icon.tsx";

export type Outcome = "bulundu" | "kacti" | "yanlis" | "bitti";

const OUTCOME_ICON: Record<Outcome, IconName> = {
  bulundu: "check",
  kacti: "bang",
  yanlis: "cross",
  bitti: "check",
};

/** Found: filled ✓ · missed: dashed ring ! · false alarm: ring ✕ · done: ring ✓. */
export function OutcomeIcon({ outcome }: { outcome: Outcome | null }) {
  return (
    <span className="simge" data-d={outcome ?? undefined} aria-hidden="true">
      {outcome && <Icon name={OUTCOME_ICON[outcome]} />}
    </span>
  );
}

const NOTCHES: Record<Severity, number> = { critical: 3, major: 2, minor: 1 };

/** Critical three bars, major two, minor one. */
export function SeverityNotch({ severity }: { severity: Severity }) {
  return (
    <span className="centik" aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <i key={bar} className={bar > NOTCHES[severity] ? "bos" : undefined} />
      ))}
    </span>
  );
}

export function SeverityLabel({ severity }: { severity: Severity }) {
  const { t } = useLanguage();
  return (
    <>
      <SeverityNotch severity={severity} /> {t(SEVERITY_KEYS[severity].name)}
    </>
  );
}

/** "◆ Real project (anonymized)" or "◇ Fictional"; read as "Origin: …". */
export function OriginLabel({ origin }: { origin: Origin }) {
  const { t } = useLanguage();
  return (
    <span className="koken" data-koken={origin}>
      <Icon name={origin === "real" ? "diamond" : "diamondOutline"} />
      <span className="gizli">{t("soru.koken.etiket")}: </span>
      {t(ORIGIN_KEYS[origin].label)}
    </span>
  );
}
