import type { RankableTask, RankedTask } from "@/lib/recommendations";
import type { TaskStatus } from "@/generated/prisma/enums";
import { RunningHead } from "@/components/running-head";

/** Ranking itself doesn't care which course a task belongs to; the lanes do. */
type LaneTask = RankableTask & { courseId: string | null };

const STATUS_WORD: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * The term table: every course a line, all read against one dateline.
 *
 * Work sits on its course's line at its due date, printed as long as it is
 * estimated to take, and today's mark crosses every line at once. That is the
 * whole thesis — a list cannot show that two deadlines collide on the same
 * afternoon, or that one course is silent for a fortnight while another is
 * dense. Position and extent carry information no ordered list can.
 *
 * It is set as a table is set: fixed columns that never move, banded stock
 * behind alternating lines, a heavy rule closing the head and the foot, and
 * state restyling an entry inside its own cell. Below the medium breakpoint
 * the lines have nowhere to go, so the page falls back to the ranked table.
 */

/** Days of the term shown either side of today. */
const DAYS_BEFORE = 7;
const DAYS_AFTER = 21;
const SPAN = DAYS_BEFORE + DAYS_AFTER;

/**
 * Minutes that read as one day of width. Low enough that an eight-fold range
 * of estimates produces an eight-fold range of blocks — at 240 the floor below
 * swallowed the difference and every block looked like the same chip.
 */
const MINUTES_PER_DAY_WIDTH = 90;

/** Narrowest an entry may print, so a ten-minute errand stays visible. */
const MIN_BLOCK_DAYS = 0.35;

/** Width of the column of course names, and so where the dateline starts. */
const NAMES = "11rem";

const monthDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

type Lane = {
  key: string;
  name: string;
  entries: RankedTask<LaneTask>[];
};

function offsetPercent(daysUntilDue: number): number {
  return ((daysUntilDue + DAYS_BEFORE) / SPAN) * 100;
}

function widthPercent(minutes: number | null): number {
  const days = Math.max(
    (minutes ?? 45) / MINUTES_PER_DAY_WIDTH,
    MIN_BLOCK_DAYS,
  );
  return (days / SPAN) * 100;
}

export function TermScore({
  ranked,
  courseNameById,
  noteCountByTaskId,
  now,
}: {
  ranked: RankedTask<LaneTask>[];
  courseNameById: Map<string, string>;
  noteCountByTaskId: Map<string, number>;
  now: Date;
}) {
  // Only dated work can sit on the dateline; undated work has no position and
  // is reported in the table beneath rather than invented onto a day.
  const dated = ranked.filter(
    (entry) =>
      entry.factors.daysUntilDue !== null &&
      entry.factors.daysUntilDue >= -DAYS_BEFORE &&
      entry.factors.daysUntilDue <= DAYS_AFTER,
  );

  if (dated.length === 0) return null;

  const lanes: Lane[] = [];
  for (const entry of dated) {
    const key = entry.task.courseId ?? "__unfiled";
    const name = entry.task.courseId
      ? (courseNameById.get(entry.task.courseId) ?? "Unknown course")
      : "No course";

    const existing = lanes.find((lane) => lane.key === key);
    if (existing) existing.entries.push(entry);
    else lanes.push({ key, name, entries: [entry] });
  }

  const nowPercent = offsetPercent(0);
  const weekTicks = [-7, 0, 7, 14, 21];

  return (
    <section aria-label="The term" className="hidden md:block">
      <RunningHead>The term</RunningHead>

      <div className="relative mt-5">
        {/* The dateline the whole table is read against. */}
        <div className="flex items-end">
          <div style={{ width: NAMES }} className="shrink-0" />
          <div className="relative h-4 flex-1">
            {weekTicks.map((day) => {
              const date = new Date(now.getTime() + day * 86_400_000);
              const isToday = day === 0;
              return (
                <span
                  key={day}
                  data-figures
                  className={
                    isToday
                      ? "absolute -translate-x-1/2 text-[0.6875rem] font-semibold tracking-[0.08em] whitespace-nowrap text-now uppercase"
                      : "absolute -translate-x-1/2 text-[0.6875rem] tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase"
                  }
                  style={{ left: `${offsetPercent(day)}%` }}
                >
                  {monthDay.format(date)}
                </span>
              );
            })}
          </div>
        </div>

        {/* The head rule. Heavy, because it closes the dateline off from the
            lines below the way a table's head rule does. */}
        <div className="mt-1.5 border-t-2 border-rule-strong" />

        {/* The lines, and today's mark laid over them. The mark starts below
            the head rule: it belongs to the lines it crosses, and running it
            up through the dateline would strike out today's own date. */}
        <div className="relative">
          {lanes.map((lane, laneIndex) => (
            <div key={lane.key} className="flex items-stretch odd:bg-band">
              <div
                style={{ width: NAMES }}
                className="flex h-12 shrink-0 items-center justify-end pr-3"
              >
                <span
                  title={lane.name}
                  className="truncate text-right text-xs text-muted-foreground"
                >
                  {lane.name}
                </span>
              </div>

              {/* --i is the line's place in the table; its rule, its entries and
                everything after read their timing from it. */}
              <div
                className="lane-rule relative h-12 flex-1"
                style={{ "--i": laneIndex } as React.CSSProperties}
              >
                {lane.entries.map((entry, blockIndex) => {
                  const days = entry.factors.daysUntilDue as number;
                  const overdue = entry.factors.urgency === "overdue";
                  const today = days === 0;
                  const noteCount = noteCountByTaskId.get(entry.task.id) ?? 0;
                  const due = overdue
                    ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} over`
                    : today
                      ? "Due today"
                      : days === 1
                        ? "Due tomorrow"
                        : `Due in ${days} days`;
                  // Past the two-thirds mark the card would run off the right
                  // edge, so it hangs from the entry's right instead.
                  const nearRightEdge = offsetPercent(days) > 62;

                  // Solid plates, not pale outlines: what has slipped is printed
                  // in oxblood, what is due today in green, everything on track
                  // in plain ink. Overprint makes a collision on one line darken
                  // where the two entries overlap, which is exactly the reading
                  // a student needs from a chart of colliding deadlines.
                  const fill = overdue
                    ? "border-plate-over bg-plate-over"
                    : today
                      ? "border-plate-now bg-plate-now"
                      : "border-rule-strong bg-[color-mix(in_oklab,var(--foreground)_24%,transparent)]";

                  return (
                    <span
                      key={entry.task.id}
                      tabIndex={0}
                      className={`animate-block-land group overprint absolute top-1/2 h-[22px] rounded-xs border focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${fill}`}
                      style={
                        {
                          left: `${offsetPercent(days)}%`,
                          width: `${widthPercent(entry.task.estimatedDuration)}%`,
                          // The entry was vertically centred by a transform,
                          // which the landing animation now owns; margin does it
                          // instead so the two never fight over the property.
                          marginTop: "-11px",
                          "--j": blockIndex,
                        } as React.CSSProperties
                      }
                    >
                      <span className="sr-only">
                        {entry.task.title} — {due}
                      </span>

                      {/*
                      Hover and keyboard focus both reveal it, and it is drawn
                      by CSS alone so this stays a server component. Pointer
                      events stay off so the card can never swallow a click
                      meant for the entry underneath. Blend mode is reset here:
                      an overprinting parent would drag the card into the
                      multiply too, and a note is read, not printed over.
                    */}
                      <span
                        aria-hidden="true"
                        className={
                          "pointer-events-none invisible absolute bottom-[calc(100%+0.5rem)] z-20 w-60 border-2 border-rule-strong bg-popover p-3 text-left mix-blend-normal opacity-0 shadow-[0_12px_28px_-12px_color-mix(in_oklab,var(--foreground)_45%,transparent)] transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 " +
                          (nearRightEdge ? "right-0" : "left-0")
                        }
                      >
                        <span className="font-display block text-sm font-semibold text-popover-foreground">
                          {entry.task.title}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {lane.name}
                        </span>
                        <span
                          data-figures
                          className={
                            overdue
                              ? "mt-2 block text-xs font-medium text-attention"
                              : today
                                ? "mt-2 block text-xs font-medium text-now"
                                : "mt-2 block text-xs text-muted-foreground"
                          }
                        >
                          {due}
                          {entry.task.estimatedDuration
                            ? ` · ${entry.task.estimatedDuration} min`
                            : ""}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {STATUS_WORD[entry.task.status]}
                          {noteCount > 0 &&
                            ` · ${noteCount} note${noteCount === 1 ? "" : "s"}`}
                        </span>
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          {/*
            One rule for the whole table rather than one per line, because
            belonging to every line at once is the entire point of it. It is
            laid over the lines and lands last.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0"
            style={{ left: NAMES }}
          >
            <span
              className="animate-now-rule absolute inset-y-0 w-0.5 bg-now"
              style={{ left: `${nowPercent}%` }}
            />
          </div>
        </div>

        {/* The foot rule closes the table. */}
        <div className="border-t-2 border-rule-strong" />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Each entry sits on its due date and is printed as long as you estimated
        it would take. The green rule is today; oxblood has slipped.
      </p>
    </section>
  );
}
