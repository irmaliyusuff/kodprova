export interface Order {
  id: string;
  totalCents: number;
  /** UTC, ISO 8601: "2026-10-10T15:00:00Z" */
  createdAt: string;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(value: string | undefined): Date | null {
  if (value === undefined || !DAY_PATTERN.test(value)) {
    return null;
  }
  const day = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(day.getTime()) || !day.toISOString().startsWith(value)) {
    return null;
  }
  return day;
}

export function ordersInRange(
  orders: Order[],
  query: { from?: string; to?: string },
) {
  const from = parseDay(query.from);
  const to = parseDay(query.to);
  if (from === null || to === null || from > to) {
    return { status: 400, body: { error: "invalid_range" } };
  }
  const end = new Date(to);
  end.setUTCDate(end.getUTCDate() + 1);
  const matching = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return createdAt >= from && createdAt < end;
  });
  return { status: 200, body: { orders: matching } };
}
