-- Migration 0001: submission counts (kodprova-sayac).
--
-- Counts only. One row = one combination of the submission fields on one UTC
-- day, plus how many submissions had it. No row per submission, no id, no time
-- of day, no IP / browser / cookie data (PRD §8, K19).
--
-- Adds only; safe to run again (IF NOT EXISTS).
-- Rollback (DELETES ALL COUNTS; only after the summary is saved and with
-- Yusuf's decision): DROP TABLE IF EXISTS submission_counts;
CREATE TABLE IF NOT EXISTS submission_counts (
  day          TEXT    NOT NULL CHECK (length(day) = 10),
  question_id  TEXT    NOT NULL CHECK (length(question_id) BETWEEN 1 AND 64),
  lang         TEXT    NOT NULL CHECK (lang IN ('tr', 'en')),
  found        INTEGER NOT NULL CHECK (found BETWEEN 0 AND 2),
  total        INTEGER NOT NULL CHECK (total BETWEEN 1 AND 2),
  false_alarms INTEGER NOT NULL CHECK (false_alarms BETWEEN 0 AND 5),
  reason_given INTEGER NOT NULL CHECK (reason_given IN (0, 1)),
  test_correct INTEGER NOT NULL CHECK (test_correct IN (0, 1)),
  submissions  INTEGER NOT NULL DEFAULT 0 CHECK (submissions >= 0),
  PRIMARY KEY (day, question_id, lang, found, total, false_alarms, reason_given, test_correct)
) WITHOUT ROWID;
