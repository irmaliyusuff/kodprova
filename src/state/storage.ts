// localStorage, used carefully: it can be missing, blocked or full (PRD K12).
// Every access is guarded; a failure only means progress is not kept.

export function isStorageAvailable(): boolean {
  try {
    const probe = "kodprova.probe";
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** False when the browser refused to store it. */
export function writeItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
