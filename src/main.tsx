// Client entry. Every address is prerendered to HTML at build time, so the
// page is readable before this runs; the app then takes over that HTML and
// adds what this browser has kept (progress, answers being written).

import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { LANGUAGE_KEY, pickStartLanguage } from "./lib/language.ts";
import { findQuestion, loadQuestion } from "./data/questions.ts";
import { parsePath } from "./lib/routes.ts";
import { RouterProvider } from "./router.tsx";
import { readItem } from "./state/storage.ts";
import { loadSavedState } from "./state/store.ts";
import "./styles/index.css";

// "/" has no language in it. The prerendered "/" sends visitors on with a
// small inline script; this covers the development server, which serves "/"
// without it.
if (window.location.pathname === "/") {
  const lang = pickStartLanguage(readItem(LANGUAGE_KEY), navigator.languages);
  window.history.replaceState(null, "", `/${lang}/`);
}

loadSavedState();

// A Question or Result page needs its whole question before the app can take
// over the prerendered HTML; a failure shows the load error screen instead.
const { route } = parsePath(window.location.pathname);
let questionFailed = false;
if (
  (route.name === "question" || route.name === "result") &&
  findQuestion(route.id)
) {
  await loadQuestion(route.id).catch(() => {
    questionFailed = true;
  });
}

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </StrictMode>
);
// The prerendered HTML is kept and brought to life (hydrated) when it was
// made for this address. The 404 page is shared by every unknown address,
// so it is rendered afresh instead, and so is a question that failed to load
// (the load error screen is not what the HTML shows).
if (root.dataset.path === window.location.pathname && !questionFailed) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
