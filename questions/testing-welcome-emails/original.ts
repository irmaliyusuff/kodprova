import assert from "node:assert/strict";
import type * as Mail from "./subject.ts";

const ADA = "ada@example.com";
const BOB = "bob@example.com";
const CY = "cy@example.com";
const USERS: Mail.User[] = [
  { email: ADA, verified: true },
  { email: BOB, verified: false },
  { email: CY, verified: true },
];

function recordingMailer() {
  const sent: string[][] = [];
  const mailer: Mail.Mailer = {
    send: async (to, template) => {
      sent.push([to, template]);
    },
  };
  return { mailer, sent };
}

export async function testSendsWelcome({ sendWelcomeEmails }: typeof Mail) {
  const { mailer, sent } = recordingMailer();
  const verified = USERS.filter((user) => user.verified);
  const report = await sendWelcomeEmails(verified, mailer);
  assert.deepEqual(sent, [
    [ADA, "welcome"],
    [CY, "welcome"],
  ]);
  assert.deepEqual(report, { sent: [ADA, CY], failed: [] });
}

export async function testSkipsUnverified({ sendWelcomeEmails }: typeof Mail) {
  const mailer: Mail.Mailer = {
    send: async (to) => {
      assert.notEqual(to, BOB, "unverified users get no email");
    },
  };
  await sendWelcomeEmails(USERS, mailer);
}

export async function testRecordsFailure({ sendWelcomeEmails }: typeof Mail) {
  const mailer: Mail.Mailer = {
    send: async (to) => {
      if (to === ADA) {
        throw new Error("mailbox full");
      }
    },
  };
  const report = await sendWelcomeEmails(USERS, mailer);
  assert.deepEqual(report.failed, [ADA]);
}

export async function testNoUsers({ sendWelcomeEmails }: typeof Mail) {
  const { mailer } = recordingMailer();
  const report = await sendWelcomeEmails([], mailer);
  assert.deepEqual(report, { sent: [], failed: [] });
}
