// B22: what happened, in one sentence, then the three counts and the test.

import {
  OriginLabel,
  OutcomeIcon,
  type Outcome,
} from "../../components/markers.tsx";
import type { SiteQuestion } from "../../data/types.ts";
import { useLanguage } from "../../i18n/language-context.tsx";
import type { MessageKey } from "../../i18n/messages.ts";
import type { Score } from "../../lib/scoring.ts";

const SUMMARY_KEYS: Record<string, MessageKey> = {
  "1.1": "sonuc.ozet.1.1",
  "1.0": "sonuc.ozet.1.0",
  "2.2": "sonuc.ozet.2.2",
  "2.1": "sonuc.ozet.2.1",
  "2.0": "sonuc.ozet.2.0",
};

export function ResultSummary({
  question,
  score,
}: {
  question: SiteQuestion;
  score: Score;
}) {
  const { lang, t } = useLanguage();
  const alarms = score.falseAlarms.length;
  const alarmSentence =
    alarms === 0
      ? t("sonuc.alarm.0")
      : alarms === 1
        ? t("sonuc.alarm.1")
        : t("sonuc.alarm.n", { y: alarms });
  const counts: [Outcome, MessageKey, number][] = [
    ["bulundu", "durum.bulundu", score.found],
    ["kacti", "durum.kacti", score.total - score.found],
    ["yanlis", "durum.alarm", alarms],
  ];
  return (
    <div className="ozet-blok">
      <p className="kunye">
        <span>
          {t("liste.kart.no", { no: question.number })} · {question.title[lang]}
        </span>
        <OriginLabel origin={question.origin} />
      </p>
      <h1>{t("sonuc.baslik")}</h1>
      <p className="ozet-cumle" role="status">
        {t(SUMMARY_KEYS[`${score.total}.${score.found}`]!)} {alarmSentence}
      </p>
      <p className="sayilar">
        {counts.map(([outcome, label, count]) => (
          <span className="durum" data-d={outcome} key={outcome}>
            <OutcomeIcon outcome={outcome} /> {t(label)} {count}
          </span>
        ))}
      </p>
      <p className="test-cumle">
        {t(score.testCorrect ? "sonuc.test.dogru" : "sonuc.test.yanlis")}
      </p>
    </div>
  );
}
