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
    await send(item.event);
    return null;
  } catch {
    return { event: item.event, attempts: item.attempts + 1 };
  }
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
    if (item.attempts > MAX_ATTEMPTS) {
      continue;
    }
    const failed = await trySend(item, send);
    if (failed) {
      stillPending.push(failed);
    }
  }
  store.save(stillPending);
}
