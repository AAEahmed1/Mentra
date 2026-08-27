/** The largest answer that still means anything. */
const MAX_AVAILABLE_MINUTES = 1440;

/** The choices offered on the dashboard, in minutes. */
export const AVAILABLE_MINUTE_PRESETS = [15, 30, 60, 90] as const;

/**
 * Reads "how long have I got" out of a URL.
 *
 * Anything malformed means no limit rather than an error: this comes from a
 * query string, which anyone can hand-edit, and the honest fallback is the
 * ranking a student sees when they haven't said.
 */
export function parseAvailableMinutes(
  value: string | string[] | undefined
): number | undefined {
  if (typeof value !== "string") return undefined;

  const minutes = Number(value);

  if (!Number.isInteger(minutes)) return undefined;
  if (minutes <= 0 || minutes > MAX_AVAILABLE_MINUTES) return undefined;

  return minutes;
}
