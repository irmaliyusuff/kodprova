export function applyDiscount(total: number, percent: number): number {
  if (percent < 0 || percent > 100) {
    throw new RangeError("percent must be from 0 to 100");
  }
  return total;
}
