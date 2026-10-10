export interface ChargeRequest {
  accountId: string;
  idempotencyKey: string;
  amountCents: number;
}

export interface ChargeAnswer {
  status: 201 | 400 | 402;
  body: { chargeId?: string; error?: string };
}

export type CardResult =
  { ok: true; chargeId: string } | { ok: false; reason: string };

export interface Dependencies {
  /** Charges the account's saved card. Never throws. */
  chargeCard(accountId: string, amountCents: number): Promise<CardResult>;
  /** Shared by all requests; keeps each answer for 24 hours. */
  answers: {
    get(key: string): Promise<ChargeAnswer | undefined>;
    set(key: string, answer: ChargeAnswer): Promise<void>;
  };
}

export function createChargeHandler({ chargeCard, answers }: Dependencies) {
  const inFlight = new Map<string, Promise<ChargeAnswer>>();
  return async function handleCharge(
    request: ChargeRequest,
  ): Promise<ChargeAnswer> {
    const { accountId, idempotencyKey, amountCents } = request;
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return { status: 400, body: { error: "invalid_amount" } };
    }
    const key = `charge:${accountId}:${idempotencyKey}`;

    let pending = inFlight.get(key);
    if (pending === undefined) {
      pending = (async () => {
        const saved = await answers.get(key);
        if (saved !== undefined) {
          return saved;
        }
        const result = await chargeCard(accountId, amountCents);
        const answer: ChargeAnswer = result.ok
          ? { status: 201, body: { chargeId: result.chargeId } }
          : { status: 402, body: { error: result.reason } };
        await answers.set(key, answer);
        return answer;
      })();
      inFlight.set(key, pending);
      const forget = () => inFlight.delete(key);
      pending.then(forget, forget);
    }
    return pending;
  };
}
