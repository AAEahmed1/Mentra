import Link from "next/link";

import { AVAILABLE_MINUTE_PRESETS } from "@/lib/available-minutes";

function label(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60}h` : `${minutes}m`;
}

/**
 * How long the student has, as a filter on the ranking.
 *
 * A link per choice rather than a control with state: the answer belongs in the
 * URL, so the page re-ranks on the server, survives a reload, and can be shared
 * or bookmarked as "what can I do in half an hour".
 */
export function TimeAvailable({ selected }: { selected: number | undefined }) {
  const options = [
    { minutes: undefined, text: "Any" },
    ...AVAILABLE_MINUTE_PRESETS.map((minutes) => ({
      minutes,
      text: label(minutes),
    })),
  ];

  return (
    <nav
      aria-label="Time available"
      className="flex shrink-0 items-center border border-rule-strong"
    >
      {options.map((option) => {
        const active = option.minutes === selected;

        return (
          <Link
            key={option.text}
            href={
              option.minutes ? `/dashboard?minutes=${option.minutes}` : "/dashboard"
            }
            aria-current={active ? "true" : undefined}
            className={
              active
                ? "bg-plate-now px-2 py-1 text-xs font-semibold text-plate-now-ink not-first:border-l not-first:border-rule-strong"
                : "px-2 py-1 text-xs text-muted-foreground transition-colors not-first:border-l not-first:border-rule-strong hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            }
          >
            {option.text}
          </Link>
        );
      })}
    </nav>
  );
}
