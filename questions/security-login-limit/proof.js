import assert from "node:assert/strict";

const START = Date.parse("2026-10-10T09:00:00Z");
const MINUTE = 60 * 1000;

/** One account, alice@example.com, whose password is "right-password". */
function setup(code) {
  const users = {
    findUser: async (email) =>
      email.toLowerCase() === "alice@example.com"
        ? { id: "u1", passwordHash: "hash:right-password" }
        : null,
  };
  const verify = async (password, hash) => hash === `hash:${password}`;
  return code.createLogin(users, verify, new Map());
}

/** Five wrong passwords, one minute apart. */
async function failFiveTimes(login, email = "alice@example.com") {
  for (let i = 0; i < 5; i += 1) {
    const answer = await login(email, "wrong", START + i * MINUTE);
    assert.equal(answer.status, 401);
  }
}

export default {
  proofs: {
    "case-resets-limit": async (code) => {
      const login = setup(code);
      await failFiveTimes(login);
      const answer = await login(
        "Alice@Example.com",
        "wrong",
        START + 6 * MINUTE,
      );
      assert.equal(answer.status, 429, "another spelling gets fresh attempts");
    },
    "lock-checked-after-password": async (code) => {
      const login = setup(code);
      await failFiveTimes(login);
      const answer = await login(
        "alice@example.com",
        "right-password",
        START + 6 * MINUTE,
      );
      assert.equal(answer.status, 429, "the lock answers before the password");
    },
  },
  options: {
    // a: After four wrong passwords, the right one logs in.
    a: async (code) => {
      const login = setup(code);
      for (let i = 0; i < 4; i += 1) {
        await login("alice@example.com", "wrong", START + i * MINUTE);
      }
      const answer = await login(
        "alice@example.com",
        "right-password",
        START + 5 * MINUTE,
      );
      assert.equal(answer.status, 200);
    },
    // b (correct): After five wrong passwords, the right one gets 429.
    b: async (code) => {
      const login = setup(code);
      await failFiveTimes(login);
      const answer = await login(
        "alice@example.com",
        "right-password",
        START + 6 * MINUTE,
      );
      assert.equal(answer.status, 429);
    },
    // c: Fifteen minutes after the first failure, the account can log in.
    c: async (code) => {
      const login = setup(code);
      await failFiveTimes(login);
      const answer = await login(
        "alice@example.com",
        "right-password",
        START + 15 * MINUTE,
      );
      assert.equal(answer.status, 200);
    },
    // d: A wrong password gets 401.
    d: async (code) => {
      const login = setup(code);
      const answer = await login("alice@example.com", "wrong", START);
      assert.equal(answer.status, 401);
    },
  },
};
