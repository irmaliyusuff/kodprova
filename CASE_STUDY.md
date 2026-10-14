# Kodprova: practice for reviewing AI-written code, and checking the practice itself

Kodprova is a free practice site for junior developers preparing for interviews. Each question shows a task given to an AI, the code it wrote and its confident handoff note; the code hides one or two bugs. You mark the lines, pick a severity, write one sentence on why and choose the test that would catch the bug. Then you see what you found and missed, the fixed code and a sample interview answer.

Live: https://kodprova.pages.dev · Source (MIT): https://github.com/irmaliyusuff/kodprova · Turkish and English · Released 14 October 2026

## The problem

The job posts I applied to asked for one skill in different words: know when the agent is wrong and verify its output with tests and reasoning. Most practice tools I found reward finding the right line. An interview asks for more: how serious the bug is, why, and which test proves it.

## Why build it when lgtmxp exists

Before writing the spec I looked at ten similar tools (10 October 2026). The closest is lgtmxp: free, no account, AI-style bugs in pull request diffs, line marking, "LGTM" for clean diffs, an explanation for every bug, XP and about a hundred exercises. The core idea was already there.

Kodprova does a narrower thing differently:

- **Real origin.** Six of the 20 questions carry the pattern of a bug that independent QA caught in code AI agents had handed over in my own projects, rewritten from scratch with nothing named. Each question is labeled “Real project (anonymized)” or “Fictional”.
- **Interview answer format.** Severity, a one-sentence reason and the proving test, compared with a sample answer and a checklist. Fixed scoring rules, no live AI calls.
- **Turkish and English.** None of the tools I looked at was in Turkish.

lgtmxp has things Kodprova v0.1 doesn't: clean code to approve, far more exercises and more languages.

## How it was built

AI agents, each working from written rules, wrote the spec, design, copy, code and questions; a separate QA agent tested their output. I made the decisions: the idea, the position next to lgtmxp, the rule for anonymizing client bugs, the design direction, the name and the release. The spec was approved on 10 October and the site went live on 14 October.

So the real question was: if AI writes the questions, how do I know the answer key is right?

## How I checked the AI's output

**1. Proof gate.** Every bug has a proof test that fails on the original code and passes on the fixed code. Only one of the 3–4 test options catches the bug; the others pass on both, and that is tested too. In the Testing topic the code is itself a test, so the proof is reversed: the original test lets a flawed implementation through and the fixed one catches it. One command, `npm run proof`, checks all 20 questions in five time zones.

**2. Blind solve.** A proof shows the defined bugs are real, not that they are the only ones. So fresh QA sub-agents solved every question without the answer key, seeing only what a user sees. They found all 26 bugs with no false alarms, yet three questions still changed: one corrected test was incomplete and two tasks were ambiguous. Changed questions were solved blind again.

**3. A different model.** The QA solvers ran on Claude Opus 5.5. I ran one more blind solve of the English version with Claude Fable 5.1 myself, since I couldn't verify a sub-agent's model; QA confirmed it from the session log. Fable also found 26 of 26, plus something the others had missed: a test meant to prove "the input list is not changed" read a list an earlier test had already trimmed. In file order, the default in node:test, Vitest and Jest, an implementation that changed its input passed both the original and the "fixed" test. The gate and QA ran tests alphabetically, so neither could see it.

**4. Turning the finding into a check.** QA then ran every Testing question in four orders (file, alphabetical, reverse, one at a time) and found two more questions sharing data the same way. After the fixes, the gate got a permanent check: every test must give the same result in all four orders, and no two tests may share an array, date or object. The new check stops the gate on the old versions of all three questions. Final record: 20 of 20, every question solved blind by two model families; changed questions were solved again by a fresh solver.

The models also disagreed with the key on severity in six places. Rather than patch them one by one, the severity scale was rewritten and four severities changed.

## Numbers

|                                                           |                                                                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Questions                                                 | 20 (4 topics × 5 levels), 26 bugs, 6 from real projects; 15 TypeScript / JavaScript, 5 Python                                                                |
| Proof gate                                                | `npm run proof`: 20 / 20                                                                                                                                     |
| Blind solve                                               | Claude Opus 5.5 (Turkish), Claude Fable 5.1 (English); 20 / 20                                                                                               |
| Automated tests                                           | `npm test`: 211 / 211 (14 October 2026)                                                                                                                      |
| Lighthouse, mobile (release candidate, 11 pages × 5 runs) | Performance ≥ 92, accessibility 100                                                                                                                          |
| Privacy                                                   | No accounts; progress stays in the browser. One 7-field counter request per submission; the counter's code reads no IP address or cookie, enforced by a test |

## Limits

- `pages.dev` addresses don't open from Turkey without a VPN; a custom domain is a candidate for the next version.
- No usage data yet. The counter is on; the first review is on 13 November 2026.
- A blind solve lowers the chance of a remaining bug; it doesn't rule it out. Every result screen links to "Report a problem".
- The host, Cloudflare, processes IP addresses on its side. The Data page states what is stored and sent; the legal text awaits a lawyer's review.

## What I learned

- A check shares the blind spots of the tool it runs on. The gate and QA used the same test order and missed the same gap; a different model family saw it.
- When a check misses something, the fix belongs in the check, not only in the question.
