// The app's state: saved progress, the answers being written, and whether
// this browser can keep anything. A small external store read with
// useSyncExternalStore; components change it only through the actions below.

import { useSyncExternalStore } from "react";
import { config } from "../config.ts";
import { questions } from "../data/questions.ts";
import type { Severity, SiteQuestion } from "../data/types.ts";
import type { Lang } from "../i18n/translate.ts";
import {
  emptyDraft,
  toggleMark as toggleDraftMark,
  toSubmittedAnswer,
  updateMark,
  type Draft,
  type ToggleResult,
} from "../lib/marks.ts";
import {
  emptyProgress,
  parseProgress,
  PROGRESS_KEY,
  serializeProgress,
  type Progress,
} from "../lib/progress.ts";
import { scoreAnswer } from "../lib/scoring.ts";
import { buildSubmission, sendSubmission } from "../lib/submission.ts";
import { isStorageAvailable, readItem, writeItem } from "./storage.ts";

export interface AppState {
  progress: Progress;
  /** "unknown" while prerendering: no notice is shown then. */
  storage: "unknown" | "available" | "unavailable";
  storageNoticeDismissed: boolean;
  /** Question id → the answer being written. Kept in memory only. */
  drafts: Record<string, Draft>;
}

/** What the prerendered HTML shows: nothing saved yet, storage not known. */
const PRERENDER_STATE: AppState = {
  progress: emptyProgress(),
  storage: "unknown",
  storageNoticeDismissed: false,
  drafts: {},
};

let state = PRERENDER_STATE;
const listeners = new Set<() => void>();

function setState(change: (current: AppState) => AppState): void {
  const next = change(state);
  if (next.progress !== state.progress && next.storage === "available") {
    if (!writeItem(PROGRESS_KEY, serializeProgress(next.progress))) {
      next.storage = "unavailable";
    }
  }
  state = next;
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Reads part of the state. While React hydrates the prerendered HTML it uses
 * the prerender state, so the first client render matches the HTML; the saved
 * progress shows in the render right after.
 */
export function useAppState<T>(select: (state: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(PRERENDER_STATE),
  );
}

/** Reads what this browser has kept. Called once, before the first render. */
export function loadSavedState(): void {
  const available = isStorageAvailable();
  setState((current) => ({
    ...current,
    storage: available ? "available" : "unavailable",
    progress: available
      ? parseProgress(readItem(PROGRESS_KEY), questions)
      : current.progress,
  }));
}

// One shared empty draft, so reading a question without one returns the same
// object every time (useSyncExternalStore needs stable snapshots).
const NO_DRAFT: Draft = emptyDraft();

export const draftOf = (state: AppState, questionId: string): Draft =>
  state.drafts[questionId] ?? NO_DRAFT;

function changeDraft(
  questionId: string,
  change: (draft: Draft) => Draft,
): void {
  setState((current) => ({
    ...current,
    drafts: {
      ...current.drafts,
      [questionId]: change(draftOf(current, questionId)),
    },
  }));
}

export function toggleMark(
  questionId: string,
  line: number,
): ToggleResult["kind"] {
  const result = toggleDraftMark(draftOf(state, questionId), line);
  if (result.kind !== "limit") changeDraft(questionId, () => result.draft);
  return result.kind;
}

export const setSeverity = (
  questionId: string,
  line: number,
  severity: Severity,
) => changeDraft(questionId, (draft) => updateMark(draft, line, { severity }));

export const setReason = (questionId: string, line: number, reason: string) =>
  changeDraft(questionId, (draft) => updateMark(draft, line, { reason }));

export const setTestChoice = (questionId: string, testChoice: string) =>
  changeDraft(questionId, (draft) => ({ ...draft, testChoice }));

/** Clears the marks for a fresh attempt; the saved result stays (PRD K14). */
export const clearDraft = (questionId: string) =>
  changeDraft(questionId, emptyDraft);

/**
 * Saves the answer as the question's result and counts it. Returns false
 * (and changes nothing) while the answer is incomplete.
 */
export function submitAnswer(question: SiteQuestion, lang: Lang): boolean {
  const answer = toSubmittedAnswer(draftOf(state, question.id));
  if (!answer) return false;
  setState((current) => {
    const { [question.id]: _submitted, ...drafts } = current.drafts;
    return {
      ...current,
      drafts,
      progress: {
        ...current.progress,
        results: { ...current.progress.results, [question.id]: answer },
      },
    };
  });
  if (config.counterEnabled) {
    sendSubmission(
      buildSubmission(question.id, lang, scoreAnswer(question, answer)),
    );
  }
  return true;
}

export function setChecklistItem(
  questionId: string,
  index: number,
  checked: boolean,
): void {
  setState((current) => {
    const length =
      questions.find((q) => q.id === questionId)?.checklistLength ?? 0;
    const ticks =
      current.progress.checklists[questionId] ??
      Array.from({ length }, () => false);
    return {
      ...current,
      progress: {
        ...current.progress,
        checklists: {
          ...current.progress.checklists,
          [questionId]: ticks.map((tick, i) => (i === index ? checked : tick)),
        },
      },
    };
  });
}

/** Deletes every result, reason and checklist tick (PRD K13). The language stays. */
export function resetProgress(): void {
  setState((current) => ({
    ...current,
    progress: emptyProgress(),
    drafts: {},
  }));
}

export function dismissStorageNotice(): void {
  setState((current) => ({ ...current, storageNoticeDismissed: true }));
}
