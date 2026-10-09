const MIN_AGE = 18;
const MAX_AGE = 65;

export function isValidAge(input: string | number): boolean {
  const age = parseInt(String(input), 10);
  if (Number.isNaN(age)) {
    return false;
  }
  return age >= MIN_AGE && age < MAX_AGE;
}

export function ageError(input: string | number): string | null {
  if (isValidAge(input)) {
    return null;
  }
  return `Age must be a whole number from ${MIN_AGE} to ${MAX_AGE}.`;
}
