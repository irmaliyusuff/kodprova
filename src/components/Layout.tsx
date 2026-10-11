// The frame of every screen: skip link, header, storage notice, main, footer.

import type { ReactNode } from "react";
import wordmark from "../assets/wordmark.svg?raw";
import { config, PRODUCT_AUTHOR } from "../config.ts";
import { useLanguage } from "../i18n/language-context.tsx";
import { LANGUAGES, translate } from "../i18n/translate.ts";
import { pathFor, switchLanguage, type Route } from "../lib/routes.ts";
import { Link, useRouter } from "../router.tsx";
import { dismissStorageNotice, useAppState } from "../state/store.ts";
import { Icon } from "./Icon.tsx";
import { ExternalLink } from "./text.tsx";

const MENU = [
  { route: { name: "list" }, label: "ortak.menu.sorular" },
  { route: { name: "progress" }, label: "ortak.menu.ilerleme" },
  { route: { name: "howItsMade" }, label: "ortak.menu.hazirlandi" },
] as const;

/** The Question and Result screens belong to "Questions" in the menu. */
const menuSection = (route: Route): Route["name"] =>
  route.name === "question" || route.name === "result" ? "list" : route.name;

function Header({ route }: { route: Route }) {
  const { lang, t } = useLanguage();
  const { path } = useRouter();
  const current = menuSection(route);
  return (
    <header className="ust">
      <Link
        className="marka"
        to={pathFor(lang, { name: "home" })}
        dangerouslySetInnerHTML={{ __html: wordmark }}
      />
      <nav className="menu" aria-label={t("ortak.menu.ac")}>
        {MENU.map((item) => (
          <Link
            key={item.route.name}
            to={pathFor(lang, item.route)}
            aria-current={item.route.name === current ? "page" : undefined}
          >
            {t(item.label)}
          </Link>
        ))}
      </nav>
      <nav className="dil" aria-label={t("ortak.dil.etiket")}>
        {LANGUAGES.map((other) => (
          <Link
            key={other}
            to={switchLanguage(path, other)}
            hrefLang={other}
            lang={other}
            aria-current={other === lang ? "true" : undefined}
          >
            <span className="uzun">
              {translate(other, `ortak.dil.${other}`)}
            </span>
            <span className="kisa">{translate(other, "ortak.dil.kisa")}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}

/** Shown when this browser cannot keep progress (B4, PRD K12). */
function StorageNotice() {
  const { t } = useLanguage();
  const visible = useAppState(
    (state) => state.storage === "unavailable" && !state.storageNoticeDismissed,
  );
  if (!visible) return null;
  return (
    <div className="serit" role="status">
      <p>{t("ortak.depolama.uyari")}</p>
      <button
        type="button"
        className="metin-dugme soluk kapat"
        aria-label={t("ortak.depolama.kapat")}
        onClick={dismissStorageNotice}
      >
        <Icon name="cross" />
      </button>
    </div>
  );
}

function Footer({ route }: { route: Route }) {
  const { lang, t } = useLanguage();
  const [beforeName, afterName] = t("ortak.alt.yapan").split(PRODUCT_AUTHOR);
  return (
    <footer className="alt">
      <span>{t("ortak.alt.lisans")}</span>
      {config.repositoryUrl && (
        <ExternalLink href={config.repositoryUrl}>
          {t("ortak.alt.kaynak")}
        </ExternalLink>
      )}
      <Link
        to={pathFor(lang, { name: "data" })}
        aria-current={route.name === "data" ? "page" : undefined}
      >
        {t("ortak.alt.veri")}
      </Link>
      <span>
        {beforeName}
        <a href={config.profileUrl}>{PRODUCT_AUTHOR}</a>
        {afterName}
      </span>
    </footer>
  );
}

export function Layout({
  route,
  children,
}: {
  route: Route;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div className="sayfa">
      <a className="atla" href="#icerik">
        {t("ortak.atla")}
      </a>
      <Header route={route} />
      <StorageNotice />
      <main id="icerik" tabIndex={-1}>
        {children}
      </main>
      <Footer route={route} />
    </div>
  );
}
