// Message keys for values that come from the question data.

import type { Language, Origin, Severity, Topic } from "../data/types.ts";
import type { MessageKey } from "./messages.ts";

export const SEVERITY_ORDER: readonly Severity[] = [
  "critical",
  "major",
  "minor",
];

export const SEVERITY_KEYS = {
  critical: { name: "onem.kritik.ad", definition: "onem.kritik.tanim" },
  major: { name: "onem.onemli.ad", definition: "onem.onemli.tanim" },
  minor: { name: "onem.kucuk.ad", definition: "onem.kucuk.tanim" },
} as const satisfies Record<
  Severity,
  { name: MessageKey; definition: MessageKey }
>;

export const TOPIC_KEYS = {
  web: { name: "konu.web.ad", description: "konu.web.tanim" },
  api: { name: "konu.api.ad", description: "konu.api.tanim" },
  security: { name: "konu.guvenlik.ad", description: "konu.guvenlik.tanim" },
  testing: { name: "konu.test.ad", description: "konu.test.tanim" },
} as const satisfies Record<
  Topic,
  { name: MessageKey; description: MessageKey }
>;

export const LANGUAGE_NAME_KEYS = {
  ts: "liste.kart.dil.ts",
  js: "liste.kart.dil.js",
  python: "liste.kart.dil.py",
} as const satisfies Record<Language, MessageKey>;

export const ORIGIN_KEYS = {
  real: { label: "koken.gercek", explanation: "sonuc.koken.gercek" },
  fictional: { label: "koken.kurgu", explanation: "sonuc.koken.kurgu" },
} as const satisfies Record<
  Origin,
  { label: MessageKey; explanation: MessageKey }
>;
