import { useLanguage } from "../i18n/language-context.tsx";
import { SEVERITY_KEYS, SEVERITY_ORDER } from "../i18n/keys.ts";
import { SeverityLabel } from "./markers.tsx";

/** The three severities with their definitions (B15); one component everywhere. */
export function SeverityScale() {
  const { t } = useLanguage();
  return (
    <ul className="onem-olcu">
      {SEVERITY_ORDER.map((severity) => (
        <li key={severity}>
          <b>
            <SeverityLabel severity={severity} />
          </b>
          <span>{t(SEVERITY_KEYS[severity].definition)}</span>
        </li>
      ))}
    </ul>
  );
}
