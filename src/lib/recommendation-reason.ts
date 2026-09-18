import type { RankFactors } from "@/lib/recommendations";

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

function timingClause(factors: RankFactors): string {
  const { urgency, daysUntilDue } = factors;

  if (urgency === "someday" || daysUntilDue === null) {
    return "it has no deadline";
  }

  if (urgency === "overdue") {
    return `it's ${plural(Math.abs(daysUntilDue), "day")} overdue`;
  }

  if (daysUntilDue === 0) return "it's due today";
  if (daysUntilDue === 1) return "it's due tomorrow";
  return `it's due in ${plural(daysUntilDue, "day")}`;
}

/**
 * Turns the factors that ranked a task into the sentence shown under it.
 *
 * Deterministic on purpose: the student can see exactly why something was
 * recommended without an AI call, and the same factors are what the assistant
 * will later read when asked "why?", which is the point: every recommendation
 * must be able to explain itself.
 */
export function explainRecommendation(factors: RankFactors): string {
  const clauses = [timingClause(factors)];

  if (factors.priority !== "medium") {
    clauses.push(`you marked it ${factors.priority} priority`);
  }

  // Only work with an estimate can fail to fit, so there is always a figure.
  if (factors.fitsAvailableTime === false) {
    clauses.push(
      `the ${factors.estimatedDuration} min estimate is longer than the time you have`
    );
  } else if (factors.estimatedDuration) {
    clauses.push(`you estimated ${factors.estimatedDuration} min`);
  }

  const joined =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, -1).join(", ")} and ${clauses[clauses.length - 1]}`;

  return `Recommended because ${joined}.`;
}
