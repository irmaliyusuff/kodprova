// E7 not found (page or question), E8 load error and E9 loading (B36).

import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/language-context.tsx";
import { NOT_FOUND_FILE, pathFor } from "../lib/routes.ts";
import { Link, useRouter } from "../router.tsx";

/**
 * The address that led nowhere, struck through like an editor's delete mark.
 * The prerendered not-found pages do not know the address, so they leave it out.
 */
function StruckPath() {
  const { path } = useRouter();
  if (path === NOT_FOUND_FILE) return null;
  return (
    <span className="yol-cizik" aria-hidden="true">
      {path}
    </span>
  );
}

export function NotFoundScreen({ questionId }: { questionId?: string }) {
  const { lang, t } = useLanguage();
  return (
    <div className="durum-ekrani">
      <StruckPath />
      <h1>{t("bulunamadi.baslik")}</h1>
      <p>
        {questionId === undefined
          ? t("bulunamadi.metin")
          : t("bulunamadi.soru", { no: questionId })}
      </p>
      <Link className="dugme" to={pathFor(lang, { name: "list" })}>
        {t("bulunamadi.dugme")}
      </Link>
    </div>
  );
}

/** Shown when a screen fails to render; a reload is the only way out. */
export function LoadErrorScreen() {
  const { t } = useLanguage();
  return (
    <div className="durum-ekrani">
      <h1>{t("ortak.hata.yukleme")}</h1>
      <button
        type="button"
        className="dugme"
        onClick={() => window.location.reload()}
      >
        {t("ortak.hata.yenile")}
      </button>
    </div>
  );
}

/**
 * While a question loads (E9). Shown only after 300 ms, so a fast load never
 * flashes it.
 */
export function LoadingScreen() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="durum-ekrani">
      <p className="yukleniyor" role="status">
        {visible ? t("ortak.yukleniyor") : ""}
      </p>
    </div>
  );
}
