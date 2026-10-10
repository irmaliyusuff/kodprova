// The time zones the proof gate runs every question in, and the check that
// each run really got its time zone. A runner reports its UTC offset at
// OFFSET_PROBE_SECONDS (scripts/lib/runner-protocol.ts); a run whose offset is
// not the expected one did not get its time zone, so the gate cannot have
// compared anything, and it says so instead of passing quietly.

export interface TimeZone {
  /** IANA name, used by Node and by Python outside Windows. */
  name: string;
  /**
   * The same offsets in the form Python on Windows understands. There, Python
   * reads TZ through the C runtime, which ignores IANA names (every run would
   * be UTC) and takes only "ABC-hh[:mm]" with a three-letter name, plus a
   * daylight-saving name for US rules.
   */
  windows: string;
  /** Expected offset at OFFSET_PROBE_SECONDS, in minutes. */
  offsetMinutes: number;
}

export const TIME_ZONES: TimeZone[] = [
  { name: "UTC", windows: "UTC0", offsetMinutes: 0 },
  { name: "Europe/Istanbul", windows: "TRT-3", offsetMinutes: 180 },
  { name: "America/Los_Angeles", windows: "PST8PDT", offsetMinutes: -480 },
  { name: "Asia/Kolkata", windows: "IST-5:30", offsetMinutes: 330 },
  { name: "Pacific/Kiritimati", windows: "LIN-14", offsetMinutes: 840 },
];

/** The TZ value for a runner: the Windows form only for Python on Windows. */
export function tzValue(
  zone: TimeZone,
  language: string,
  platform: NodeJS.Platform = process.platform,
): string {
  return language === "python" && platform === "win32"
    ? zone.windows
    : zone.name;
}

/**
 * Names the runs whose UTC offset is not the one their time zone has, or
 * returns undefined when every run got its time zone.
 */
export function zonesNotApplied(
  runs: Array<{ zone: string; utcOffsetMinutes: number }>,
): string | undefined {
  const wrong = runs.flatMap(({ zone, utcOffsetMinutes }) => {
    const expected = TIME_ZONES.find((item) => item.name === zone);
    return expected?.offsetMinutes === utcOffsetMinutes
      ? []
      : [`${zone} ran at UTC${formatOffset(utcOffsetMinutes)}`];
  });
  if (wrong.length === 0) {
    return undefined;
  }
  return (
    "time-zone check SKIPPED: the time zone was not applied " +
    `(${wrong.join("; ")}), so a result that depends on it is not caught here`
  );
}

export function formatOffset(minutes: number): string {
  if (!Number.isFinite(minutes)) {
    return " (offset unknown)";
  }
  const sign = minutes < 0 ? "-" : "+";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return `${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
}
