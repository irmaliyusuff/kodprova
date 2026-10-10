import { Component, useEffect, type ReactNode } from "react";
import { Layout } from "./components/Layout.tsx";
import { findQuestion, useQuestion } from "./data/questions.ts";
import { LanguageProvider } from "./i18n/language-context.tsx";
import type { Lang } from "./i18n/translate.ts";
import { LANGUAGE_KEY } from "./lib/language.ts";
import { parsePath, pathFor, type Route } from "./lib/routes.ts";
import { pageTitle } from "./page-meta.ts";
import { useRouter } from "./router.tsx";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { HowItsMadeScreen } from "./screens/HowItsMadeScreen.tsx";
import { ProgressScreen } from "./screens/ProgressScreen.tsx";
import { QuestionListScreen } from "./screens/QuestionListScreen.tsx";
import { QuestionScreen } from "./screens/question/QuestionScreen.tsx";
import { ResultScreen } from "./screens/result/ResultScreen.tsx";
import {
  LoadErrorScreen,
  LoadingScreen,
  NotFoundScreen,
} from "./screens/StatusScreens.tsx";
import { writeItem } from "./state/storage.ts";
import { useAppState } from "./state/store.ts";

/** The Question and Result screens, once the whole question has loaded. */
function QuestionRoute({
  id,
  showResult,
  lang,
}: {
  id: string;
  showResult: boolean;
  lang: Lang;
}) {
  const { navigate } = useRouter();
  const loaded = useQuestion(id);
  const answer = useAppState((state) => state.progress.results[id]);
  const storageKnown = useAppState((state) => state.storage !== "unknown");
  // A result address of an unsolved question shows the question instead.
  const solveFirst = showResult && !answer && storageKnown;

  useEffect(() => {
    if (solveFirst) {
      navigate(pathFor(lang, { name: "question", id }), { replace: true });
    }
  }, [solveFirst, id, lang, navigate]);

  if (loaded.status === "failed") return <LoadErrorScreen />;
  if (loaded.status === "loading") return <LoadingScreen />;
  const { question } = loaded;
  // A new key per question: a fresh screen, not leftovers of the last one.
  if (!showResult) return <QuestionScreen key={id} question={question} />;
  return answer ? (
    <ResultScreen key={id} question={question} answer={answer} />
  ) : null;
}

function Screen({ route, lang }: { route: Route; lang: Lang }) {
  switch (route.name) {
    case "home":
      return <HomeScreen />;
    case "list":
      return <QuestionListScreen />;
    case "progress":
      return <ProgressScreen />;
    case "howItsMade":
      return <HowItsMadeScreen />;
    case "question":
    case "result":
      if (!findQuestion(route.id)) {
        return <NotFoundScreen questionId={route.id} />;
      }
      return (
        <QuestionRoute
          id={route.id}
          showResult={route.name === "result"}
          lang={lang}
        />
      );
    case "notFound":
      return <NotFoundScreen />;
  }
}

/** A screen that throws shows the load error instead of a blank page (E8). */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <LoadErrorScreen /> : this.props.children;
  }
}

export function App({ fallbackLang = "tr" }: { fallbackLang?: Lang }) {
  const { path } = useRouter();
  const location = parsePath(path);
  const lang = location.lang ?? fallbackLang;
  const route = location.route;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = pageTitle(route, lang);
    if (location.lang) writeItem(LANGUAGE_KEY, location.lang);
  });

  return (
    <LanguageProvider lang={lang}>
      <Layout route={route}>
        {/* Keyed by screen, not by address: switching language keeps the screen. */}
        <ErrorBoundary key={JSON.stringify(route)}>
          <Screen route={route} lang={lang} />
        </ErrorBoundary>
      </Layout>
    </LanguageProvider>
  );
}
