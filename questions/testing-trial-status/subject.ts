export type TrialState = "active" | "ending-soon" | "expired";

const DAY = 24 * 60 * 60 * 1000;

/** active: more than 3 days left; ending-soon: up to 3; expired: none. */
export function trialState(endsAt: Date, now: Date): TrialState {
  const left = endsAt.getTime() - now.getTime();
  if (left <= 0) {
    return "expired";
  }
  return left <= 3 * DAY ? "ending-soon" : "active";
}

/** Whole days left, rounded up; 0 once the trial has ended. */
export function daysLeft(endsAt: Date, now: Date): number {
  const left = endsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(left / DAY));
}
