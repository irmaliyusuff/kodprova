// "Report a problem" opens a new issue on the public repository with the
// question number and the interface language filled in. It never carries the
// user's marks, reasons or result (PRD K15).

import { translate, type Lang } from "../i18n/translate.ts";

export function issueUrl(
  repositoryUrl: string,
  questionNumber: number,
  lang: Lang,
): string {
  const values = { no: questionNumber, dil: lang.toUpperCase() };
  const title = translate(lang, "sorun.sablon.baslik", values);
  const body = [
    translate(lang, "sorun.sablon.govde.1", values),
    translate(lang, "sorun.sablon.govde.2"),
    translate(lang, "sorun.sablon.govde.3"),
    translate(lang, "sorun.sablon.govde.4"),
  ].join("\n\n");
  const query = new URLSearchParams({ title, body });
  return `${repositoryUrl.replace(/\/+$/, "")}/issues/new?${query}`;
}
