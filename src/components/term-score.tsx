import type { RankableTask, RankedTask } from "@/lib/recommendations";

/** Ranking itself doesn't care which course a task belongs to; the lanes do. */
type LaneTask = RankableTask & { courseId: string | null };

/**
 * The score itself: every course a line, all read against one timeline.
 *
 * Work sits on its course's lane at its due date, drawn as long as it is
 * estimated to take, and the NOW rule crosses every lane at today. That is the
 * whole thesis — a list cannot show that two deadlines collide on the same
 * afternoon, or that one course is silent for a fortnight while another is
 * dense. Position and extent carry information no ordered list can.
 *
 * Below the medium breakpoint the lanes have nowhere to go, so the page falls
 * back to the ranked list. The score is a desktop reading; the list is the
 * phone one.
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

/** Narrowest a block may draw, so a ten-minute errand stays visible. */
const MIN_BLOCK_DAYS = 0.35;

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
    MIN_BLOCK_DAYS
  );
  return (days / SPAN) * 100;
}

export function TermScore({
  ranked,
  courseNameById,
  now,
}: {
  ranked: RankedTask<LaneTask>[];
  courseNameById: Map<string, string>;
  now: Date;
}) {
  // Only dated work can sit on the timeline; undated work has no position and
  // is reported in the list beneath rather than invented onto a day.
  const dated = ranked.filter(
    (entry) =>
      entry.factors.daysUntilDue !== null &&
      entry.factors.daysUntilDue >= -DAYS_BEFORE &&
      entry.factors.daysUntilDue <= DAYS_AFTER
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
    <section
      aria-label="The term"
      className="hidden md:block"
    >
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          The term
        </h2>
        <span aria-hidden="true" className="h-px flex-1 bg-rule" />
      </div>

      <div className="mt-5 grid grid-cols-[12rem_1fr] gap-x-4">
        {/* The ruler every lane is read against. */}
        <div />
        <div className="relative h-5 border-b border-rule">
          {weekTicks.map((day) => {
            const date = new Date(now.getTime() + day * 86_400_000);
            return (
              <span
                key={day}
                data-figures
                className="absolute -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground"
                style={{ left: `${offsetPercent(day)}%` }}
              >
                {monthDay.format(date)}
              </span>
            );
          })}
        </div>

        {lanes.map((lane) => (
          <div key={lane.key} className="contents">
            <div className="flex h-12 items-center justify-end pr-1">
              <span
                title={lane.name}
                className="truncate text-right text-xs text-muted-foreground"
              >
                {lane.name}
              </span>
            </div>

            <div className="lane-rule relative h-12">
              {/* The NOW rule crosses every lane, which is the point of it. */}
              <span
                aria-hidden="true"
                className="animate-now-rule absolute inset-y-0 w-px bg-now"
                style={{ left: `${nowPercent}%` }}
              />

              {lane.entries.map((entry) => {
                const days = entry.factors.daysUntilDue as number;
                const overdue = entry.factors.urgency === "overdue";

                return (
                  <span
                    key={entry.task.id}
                    title={`${entry.task.title} — ${
                      overdue
                        ? `${Math.abs(days)} days over`
                        : days === 0
                          ? "due today"
                          : `due in ${days} days`
                    }`}
                    className={
                      overdue
                        ? "absolute top-1/2 h-6 -translate-y-1/2 rounded-sm border border-attention bg-attention/30"
                        : "absolute top-1/2 h-6 -translate-y-1/2 rounded-sm border border-rule bg-muted"
                    }
                    style={{
                      left: `${offsetPercent(days)}%`,
                      width: `${widthPercent(entry.task.estimatedDuration)}%`,
                    }}
                  >
                    <span className="sr-only">{entry.task.title}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Each block sits on its due date, drawn as long as you estimated it would
        take. The line marks today.
      </p>
    </section>
  );
}
