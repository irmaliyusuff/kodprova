export interface AnalyticsEvent {
  name: string;
  payload: Record<string, unknown>;
}

export interface PendingEvent {
  event: AnalyticsEvent;
  attempts: number;
}

export interface PendingStore {
  load(): PendingEvent[];
  save(pending: PendingEvent[]): void;
}

export type Send = (event: AnalyticsEvent) => Promise<Response>;

const MAX_ATTEMPTS = 3;

async function trySend(
  item: PendingEvent,
  send: Send,
): Promise<PendingEvent | null> {
  try {
    const response = await send(item.event);
    if (response.status < 500) {
      return null;
    }
  } catch {
    // Network error: keep the event and retry it later.
  }
  return { event: item.event, attempts: item.attempts + 1 };
}

export async function track(
  event: AnalyticsEvent,
  store: PendingStore,
  send: Send,
): Promise<void> {
  const failed = await trySend({ event, attempts: 0 }, send);
  if (failed) {
    store.save([...store.load(), failed]);
  }
}

export async function retryPending(
  store: PendingStore,
  send: Send,
): Promise<void> {
  const stillPending: PendingEvent[] = [];
  for (const item of store.load()) {
    if (item.attempts >= MAX_ATTEMPTS) {
      continue;
    }
    const failed = await trySend(item, send);
    if (failed) {
      stillPending.push(failed);
    }
  }
  store.save(stillPending);
}
