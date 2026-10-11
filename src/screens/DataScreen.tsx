// The Data page: what the site keeps on the device, what one submission sends
// to the counter, how the totals are kept and what the hosting does. Facts
// only; it is not a legal text. Laid out like How it's made (B33).

import type { ReactNode } from "react";
import { ArticleSection } from "../components/ArticleSection.tsx";
import { ExternalLink } from "../components/text.tsx";
import {
  config,
  CONTACT_EMAIL_PLACEHOLDER,
  PRODUCT_AUTHOR,
} from "../config.ts";
import { builtOn } from "../data/questions.ts";
import { useLanguage } from "../i18n/language-context.tsx";
import type { MessageKey } from "../i18n/messages.ts";
import { formatDay } from "../lib/dates.ts";

/** The seven fields of one submission, in the order of the request body. */
const COUNTER_FIELDS: MessageKey[] = [
  "veri.sayac.alan.1",
  "veri.sayac.alan.2",
  "veri.sayac.alan.3",
  "veri.sayac.alan.4",
  "veri.sayac.alan.5",
  "veri.sayac.alan.6",
  "veri.sayac.alan.7",
];

/** The text with the contact address as a mailto link (plain without one). */
function withEmail(text: string): ReactNode {
  const email = config.contactEmail;
  if (!email) return text;
  return text.split(email).flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <a key={index} href={`mailto:${email}`}>
            {email}
          </a>,
          part,
        ],
  );
}

export function DataScreen() {
  const { lang, t } = useLanguage();
  const slots = {
    "iletisim.eposta": config.contactEmail ?? CONTACT_EMAIL_PLACEHOLDER,
    "site.sahibi": PRODUCT_AUTHOR,
    "veri.saklamaAy": config.retentionMonths,
    "veri.tarih": formatDay(lang, builtOn),
  };

  return (
    <>
      <div className="makale-bas">
        <h1>{t("veri.baslik")}</h1>
        <p className="ozet">{t("veri.ozet")}</p>
      </div>

      <ArticleSection
        id="kim"
        title="veri.kim.baslik"
        params={slots}
        paragraphs={[
          "veri.kim.metin",
          <p key="iletisim">{withEmail(t("veri.kim.iletisim", slots))}</p>,
        ]}
      />

      <ArticleSection
        id="yok"
        title="veri.yok.baslik"
        paragraphs={[
          "veri.yok.metin",
          <p key="github" className="kucuk-not">
            {t("veri.yok.github")}
          </p>,
        ]}
      />

      <ArticleSection
        id="cihaz"
        title="veri.cihaz.baslik"
        paragraphs={[
          "veri.cihaz.metin1",
          "veri.cihaz.metin2",
          "veri.cihaz.sil",
          "veri.cihaz.dil",
        ]}
      />

      <ArticleSection
        id="sayac"
        title="veri.sayac.baslik"
        paragraphs={[
          "veri.sayac.metin",
          <ul key="alanlar" className="veri-alanlar">
            {COUNTER_FIELDS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>,
          "veri.sayac.yok",
          "veri.sayac.kapatma",
        ]}
      />

      <ArticleSection
        id="saklama"
        title="veri.saklama.baslik"
        params={slots}
        paragraphs={[
          "veri.saklama.metin1",
          "veri.saklama.metin2",
          "veri.amac",
          "veri.paylasim",
        ]}
      />

      <ArticleSection
        id="barindirma"
        title="veri.barindirma.baslik"
        paragraphs={[
          "veri.barindirma.metin1",
          "veri.barindirma.metin2",
          <p key="baglanti">
            <ExternalLink href={config.cloudflarePrivacyUrl}>
              {t("veri.barindirma.baglanti")}
            </ExternalLink>
          </p>,
        ]}
      />

      {/*
        The legal part (copy deck veri.hukuk.ek.*: legal basis, transfer
        abroad, rights) is written by a lawyer or from a trusted template.
        Until it exists nothing of it is shown, not even a heading; its
        paragraphs go after veri.hukuk.metin.
      */}
      <ArticleSection
        id="hukuk"
        title="veri.hukuk.baslik"
        paragraphs={[
          <p key="metin">{withEmail(t("veri.hukuk.metin", slots))}</p>,
        ]}
      />

      <p className="makale-son">{t("veri.surum", slots)}</p>
    </>
  );
}
