// E6 How it's made: where the questions come from and why they can be
// trusted. Sections are articles with margin notes (B33).

import type { ReactNode } from "react";
import { OriginLabel } from "../components/markers.tsx";
import { SeverityScale } from "../components/SeverityScale.tsx";
import { ExternalLink } from "../components/text.tsx";
import { config, licenseUrl, PRODUCT_AUTHOR } from "../config.ts";
import { questions, realOriginCount } from "../data/questions.ts";
import { useLanguage } from "../i18n/language-context.tsx";
import type { MessageKey } from "../i18n/messages.ts";

interface SectionProps {
  id: string;
  title: MessageKey;
  paragraphs: (MessageKey | false)[];
  margin?: ReactNode;
  children?: ReactNode;
}

function ArticleSection({
  id,
  title,
  paragraphs,
  margin,
  children,
}: SectionProps) {
  const { t } = useLanguage();
  return (
    <section
      className="makale-bolum izgara"
      id={id}
      aria-labelledby={`${id}-baslik`}
    >
      <div>
        <h2 id={`${id}-baslik`}>{t(title)}</h2>
        <div className="okuma">
          {paragraphs
            .filter((key): key is MessageKey => key !== false)
            .map((key) => (
              <p key={key}>{t(key)}</p>
            ))}
        </div>
        {children}
      </div>
      {margin && <aside className="kenar-not kenarda">{margin}</aside>}
    </section>
  );
}

export function HowItsMadeScreen() {
  const { t } = useLanguage();
  const repository = config.repositoryUrl;
  const repositoryButton = (className: string) =>
    repository && (
      <ExternalLink className={className} href={repository}>
        {t("nasil.dugme.depo")}
      </ExternalLink>
    );

  return (
    <>
      <div className="makale-bas">
        <h1>{t("nasil.baslik")}</h1>
        <p className="ozet">{t("nasil.ozet")}</p>
      </div>

      <ArticleSection
        id="koken"
        title="nasil.koken.baslik"
        paragraphs={[
          "nasil.koken.metin1",
          "nasil.koken.metin2",
          "nasil.koken.metin3",
        ]}
        margin={
          <>
            <p>
              <OriginLabel origin="real" />
            </p>
            <p className="kenar-sayi">
              {t("nasil.koken.sayi", {
                "kunye.soru": questions.length,
                "kunye.gercek": realOriginCount,
              })}
            </p>
          </>
        }
      />

      <ArticleSection
        id="kanit"
        title="nasil.kanit.baslik"
        // Without a public repository there is nothing to run the command in.
        paragraphs={[
          "nasil.kanit.metin1",
          "nasil.kanit.metin2",
          !!repository && "nasil.kanit.metin3",
        ]}
        margin={
          repository && (
            <>
              <p>{t("nasil.kanit.komut", { "site.kanitKomut": "" }).trim()}</p>
              <code className="komut">{config.proofCommand}</code>
              {repositoryButton("dugme ikincil kucuk")}
            </>
          )
        }
      />

      <ArticleSection
        id="kor"
        title="nasil.kor.baslik"
        paragraphs={[
          "nasil.kor.metin1",
          config.secondModelBlindSolveDone
            ? "nasil.kor.metin2"
            : "nasil.kor.metin2.yedek",
        ]}
      />

      <ArticleSection
        id="puan"
        title="nasil.puan.baslik"
        paragraphs={["nasil.puan.metin1", "nasil.puan.metin2"]}
      >
        <h3>{t("nasil.onem.baslik")}</h3>
        <SeverityScale />
      </ArticleSection>

      <ArticleSection
        id="veri"
        title="nasil.veri.baslik"
        paragraphs={[
          "nasil.veri.metin1",
          config.counterEnabled
            ? "nasil.veri.sayac.acik"
            : "nasil.veri.sayac.kapali",
        ]}
      />

      <ArticleSection
        id="lisans"
        title="nasil.lisans.baslik"
        // The license and issue sentences point into the repository.
        paragraphs={[
          !!repository && "nasil.lisans.metin",
          "nasil.katki.metin",
          !!repository && "nasil.sorun.metin",
        ]}
        margin={
          repository && (
            <>
              {repositoryButton("dugme kucuk")}
              <p>
                <ExternalLink href={licenseUrl(repository)}>
                  {t("nasil.dugme.lisans")}
                </ExternalLink>
              </p>
            </>
          )
        }
      >
        <p className="yazi-tipi-atfi">{t("nasil.lisans.yazitipi")}</p>
      </ArticleSection>

      <ArticleSection
        id="sinir"
        title="nasil.sinir.baslik"
        paragraphs={["nasil.sinir.metin"]}
      />

      <section
        className="makale-bolum"
        id="yapan"
        aria-labelledby="yapan-baslik"
      >
        <h2 id="yapan-baslik">{t("nasil.yapan.baslik")}</h2>
        <p className="okuma">
          {t("nasil.yapan.metin")
            .split(PRODUCT_AUTHOR)
            .flatMap((part, index) =>
              index === 0
                ? [part]
                : [
                    <a key="ad" href={config.profileUrl}>
                      {PRODUCT_AUTHOR}
                    </a>,
                    part,
                  ],
            )}
        </p>
      </section>
    </>
  );
}
