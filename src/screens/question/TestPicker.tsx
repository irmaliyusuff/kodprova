// B17: pick the test that proves the bug. Native radios: one choice, arrow
// keys move between options (K7).

import { InlineText, Warning } from "../../components/text.tsx";
import type { SiteQuestion } from "../../data/types.ts";
import { useLanguage } from "../../i18n/language-context.tsx";

export const TEST_ERROR_ID = "test-hata";

export function TestPicker({
  question,
  choice,
  showError,
  onChoose,
}: {
  question: SiteQuestion;
  choice: string | null;
  showError: boolean;
  onChoose: (optionId: string) => void;
}) {
  const { lang, t } = useLanguage();
  return (
    <>
      <fieldset
        className="test-sec"
        aria-describedby={showError ? TEST_ERROR_ID : undefined}
      >
        <legend className="gizli">{t("test.secenek.etiket")}</legend>
        {question.testQuestion.options.map((option) => (
          <label
            key={option.id}
            data-secili={choice === option.id || undefined}
          >
            <input
              type="radio"
              name="test"
              value={option.id}
              checked={choice === option.id}
              onChange={() => onChoose(option.id)}
            />
            <span>
              <InlineText text={option.text[lang]} />
            </span>
          </label>
        ))}
      </fieldset>
      {showError && (
        <div className="test-uyari">
          <Warning id={TEST_ERROR_ID}>{t("test.hata")}</Warning>
        </div>
      )}
    </>
  );
}
