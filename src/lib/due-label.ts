/**
 * The words a due column prints for a count of days.
 *
 * Shared between the dashboard's ranked table and the example edition on the
 * landing page, so a visitor reads exactly the labels a student will.
 */
export function dueLabel(daysUntilDue: number | null): string {
  if (daysUntilDue === null) return "No deadline";
  if (daysUntilDue < 0) {
    const days = Math.abs(daysUntilDue);
    return `${days} day${days === 1 ? "" : "s"} over`;
  }
  if (daysUntilDue === 0) return "Today";
  if (daysUntilDue === 1) return "Tomorrow";
  return `${daysUntilDue} days`;
}

/** The decisive figure and the words for it, as they read on the band. */
export function countdown(daysUntilDue: number | null): {
  figure: string;
  word: string;
} {
  if (daysUntilDue === null) return { figure: "—", word: "no date" };
  if (daysUntilDue < 0) {
    const days = Math.abs(daysUntilDue);
    return {
      figure: String(days),
      word: days === 1 ? "day over" : "days over",
    };
  }
  if (daysUntilDue === 0) return { figure: "0", word: "due today" };
  return {
    figure: String(daysUntilDue),
    word: daysUntilDue === 1 ? "day left" : "days left",
  };
}
