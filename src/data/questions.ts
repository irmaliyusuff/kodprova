// The questions: every summary up front, a whole question when its screen
// opens (see types.ts for why the data is split).

import { useEffect, useSyncExternalStore } from "react";
import index from "../../generated/site-index.json";
import type { QuestionSummary, SiteQuestion, Topic } from "./types.ts";

/** All questions in list order: topic by topic, easiest first. */
export const questions: QuestionSummary[] = index.questions;

export const findQuestion = (id: string) =>
  questions.find((question) => question.id === id);

export const questionsIn = (topic: Topic) =>
  questions.filter((question) => question.topic === topic);

export const realOriginCount = questions.filter(
  (question) => question.origin === "real",
).length;

// Each file becomes its own small chunk, fetched on first use.
const files = import.meta.glob<SiteQuestion>(
  "../../generated/questions/*.json",
  {
    import: "default",
  },
);
const loaders = new Map(
  Object.entries(files).map(([path, load]) => [
    path.replace(/^.*\/|\.json$/g, ""),
    load,
  ]),
);

type Entry =
  | { status: "loading"; promise: Promise<SiteQuestion> }
  | { status: "ready"; question: SiteQuestion }
  | { status: "failed" };

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();

/** Loads a whole question once; later calls share the same result. */
export function loadQuestion(id: string): Promise<SiteQuestion> {
  const entry = entries.get(id);
  if (entry?.status === "ready") return Promise.resolve(entry.question);
  if (entry?.status === "loading") return entry.promise;
  const load = loaders.get(id);
  if (!load) return Promise.reject(new Error(`No question "${id}"`));
  const promise = load().then(
    (question) => {
      entries.set(id, { status: "ready", question });
      return question;
    },
    (error: unknown) => {
      entries.set(id, { status: "failed" });
      throw error;
    },
  );
  entries.set(id, { status: "loading", promise });
  void promise
    .finally(() => listeners.forEach((listener) => listener()))
    .catch(() => {});
  return promise;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export type QuestionState =
  | { status: "loading" }
  | { status: "ready"; question: SiteQuestion }
  | { status: "failed" };

/** The whole question for a screen; starts loading it when needed. */
export function useQuestion(id: string): QuestionState {
  const entry = useSyncExternalStore(
    subscribe,
    () => entries.get(id),
    () => entries.get(id),
  );
  useEffect(() => {
    if (!entry) void loadQuestion(id).catch(() => {});
  }, [entry, id]);
  if (entry?.status === "ready") return entry;
  if (entry?.status === "failed") return { status: "failed" };
  return { status: "loading" };
}
