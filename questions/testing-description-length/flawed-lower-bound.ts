const MIN_LENGTH = 70;
const MAX_LENGTH = 160;

export type DescriptionError = "too-short" | "too-long";

/** Checks an article's meta description; null means it is valid. */
export function descriptionError(text: string): DescriptionError | null {
  const length = text.trim().length;
  if (length < MIN_LENGTH) {
    return "too-short";
  }
  if (length > MAX_LENGTH) {
    return "too-long";
  }
  return null;
}
