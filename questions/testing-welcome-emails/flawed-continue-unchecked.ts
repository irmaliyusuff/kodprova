export interface User {
  email: string;
  verified: boolean;
}

export interface Mailer {
  send(to: string, template: string): Promise<void>;
}

export interface SendReport {
  sent: string[];
  failed: string[];
}

export async function sendWelcomeEmails(
  users: User[],
  mailer: Mailer,
): Promise<SendReport> {
  const report: SendReport = { sent: [], failed: [] };
  for (const user of users) {
    if (!user.verified) {
      continue;
    }
    try {
      await mailer.send(user.email, "welcome");
      report.sent.push(user.email);
    } catch {
      report.failed.push(user.email);
      break;
    }
  }
  return report;
}
