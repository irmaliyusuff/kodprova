const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * @typedef {{ id: string, passwordHash: string }} User
 * @typedef {{ count: number, since: number }} Attempts
 */

/**
 * POST /login with a limit on failed attempts per account.
 *
 * @param {{ findUser(email: string): Promise<User | null> }} users
 *   Finds a user by email, ignoring letter case.
 * @param {(password: string, hash: string) => Promise<boolean>} verify
 * @param {Map<string, Attempts>} attempts Shared by all requests.
 */
export function createLogin(users, verify, attempts) {
  /**
   * @param {string} email
   * @param {string} password
   * @param {number} now Milliseconds since the epoch.
   */
  return async function login(email, password, now) {
    const key = email.trim().toLowerCase();
    let entry = attempts.get(key);
    if (entry === undefined || now - entry.since >= WINDOW_MS) {
      entry = { count: 0, since: now };
      attempts.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > MAX_FAILED_ATTEMPTS) {
      return { status: 429 };
    }

    const user = await users.findUser(key);
    if (user !== null && (await verify(password, user.passwordHash))) {
      attempts.delete(key);
      return { status: 200, userId: user.id };
    }
    return { status: 401 };
  };
}
