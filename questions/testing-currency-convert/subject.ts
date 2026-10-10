export interface RateSource {
  /** How many units of `to` one unit of `from` buys. */
  rate(from: string, to: string): Promise<number>;
}

/** Converts a price and rounds it to cents. */
export async function convertPrice(
  amount: number,
  from: string,
  to: string,
  rates: RateSource,
): Promise<number> {
  if (from === to) {
    return amount;
  }
  const rate = await rates.rate(from, to);
  return Math.round(amount * rate * 100) / 100;
}
