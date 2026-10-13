import assert from "node:assert/strict";
import type { ProofSuite } from "../../scripts/lib/proof-suite.ts";
import type * as Mail from "./subject.ts";

const ADA = "ada@example.com";
const BOB = "bob@example.com";
const CY = "cy@example.com";
const makeUsers = (): Mail.User[] => [
  { email: ADA, verified: true },
  { email: BOB, verified: false },
  { email: CY, verified: true },
];

/** A mailer that records each recipient; it throws for `failFor`. */
function mailer(failFor?: string) {
  const recipients: string[] = [];
  const send: Mail.Mailer["send"] = async (to) => {
    recipients.push(to);
    if (to === failFor) {
      throw new Error("mailbox full");
    }
  };
  return { mailer: { send }, recipients };
}

// Testing topic: no proofs; the gate runs the original and fixed tests
// against subject.ts and flawed-<bug id>.ts. Options run against the same.
export default {
  options: {
    // a: With Ada and Cy (both verified), the report's sent list is both.
    a: async (code) => {
      const verified = makeUsers().filter((user) => user.verified);
      const report = await code.sendWelcomeEmails(verified, mailer().mailer);
      assert.deepEqual(report.sent, [ADA, CY]);
    },
    // b (correct): Recipients recorded by the mock and checked after the
    // call are exactly Ada and Cy.
    b: async (code) => {
      const fake = mailer();
      await code.sendWelcomeEmails(makeUsers(), fake.mailer);
      assert.deepEqual(fake.recipients, [ADA, CY]);
    },
    // c: When sending to Ada fails, the report's failed list is Ada.
    c: async (code) => {
      const report = await code.sendWelcomeEmails(
        makeUsers(),
        mailer(ADA).mailer,
      );
      assert.deepEqual(report.failed, [ADA]);
    },
    // d: An assertion inside the mock that the recipient is not Bob, and
    // the call finishes without an error.
    d: async (code) => {
      const strict: Mail.Mailer = {
        send: async (to) => assert.notEqual(to, BOB),
      };
      await code.sendWelcomeEmails(makeUsers(), strict);
    },
  },
} satisfies ProofSuite<typeof Mail>;
