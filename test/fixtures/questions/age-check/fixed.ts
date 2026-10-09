const MIN_AGE = 18;
const MAX_AGE = 65;

export function isValidAge(input: string | number): boolean {
  const text = String(input).trim();
  if (!/^\d+$/.test(text)) {
    return false;
  }
  const age = Number(text);
  return age >= MIN_AGE && age <= MAX_AGE;
}

export function ageError(input: string | number): string | null {
  if (isValidAge(input)) {
    return null;
  }
  return `Age must be a whole number from ${MIN_AGE} to ${MAX_AGE}.`;
}
