export function parseLateGraceMinutes(value: unknown, fallback = 30): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseTimeToSeconds(timeValue: unknown, defaultTime: string): number {
  const raw = typeof timeValue === "string" && timeValue.trim() ? timeValue.trim() : defaultTime;
  const parts = raw.split(":");
  const h = Number.parseInt(parts[0] ?? "", 10);
  const m = Number.parseInt(parts[1] ?? "", 10);
  const s = Number.parseInt(parts[2] ?? "", 10);

  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return parseTimeToSeconds(defaultTime, "09:30:00");
  }

  const safeS = Number.isFinite(s) ? s : 0;
  return h * 3600 + m * 60 + safeS;
}

/**
 * Determine check-in punctuality status at check-in time.
 * Stored statically in the attendance record so future staff schedule edits never affect historical records.
 */
export function evaluateCheckInStatus(params: {
  timingType?: string | null;
  workStartTime?: string | null;
  gracePeriodMinutes?: unknown;
  checkInTime: string;
}): "present" | "late" {
  if (params.timingType === "any_time") {
    return "present";
  }

  const startSeconds = parseTimeToSeconds(params.workStartTime, "09:30:00");
  const graceMinutes = parseLateGraceMinutes(params.gracePeriodMinutes, 30);
  const thresholdSeconds = startSeconds + graceMinutes * 60;
  const checkInSeconds = parseTimeToSeconds(params.checkInTime, "00:00:00");

  return checkInSeconds > thresholdSeconds ? "late" : "present";
}
