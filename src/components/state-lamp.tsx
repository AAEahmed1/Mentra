/**
 * The lamp column.
 *
 * One glyph wide at the head of every line in a table, so a student can find
 * what has slipped by running a finger down the left edge rather than reading
 * the due column. It is a second reading of what the due column already says
 * in words — never the only carrier of the state.
 *
 * A filled square is printed in the plate that state belongs to; on-track work
 * is a hollow square, which is to say no ink at all.
 */
const WORD = {
  over: "Overdue",
  today: "Due today",
  "on-track": "On track",
} as const;

export function StateLamp({ state }: { state: keyof typeof WORD }) {
  return (
    <span className="flex items-center">
      <span
        aria-hidden="true"
        className={
          state === "over"
            ? "size-2 bg-plate-over"
            : state === "today"
              ? "size-2 bg-plate-now"
              : "size-2 border border-rule-strong"
        }
      />
      <span className="sr-only">{WORD[state]}</span>
    </span>
  );
}
