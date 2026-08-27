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
    <nav aria-label="Time available" className="flex items-center gap-1">
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
                ? "rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
                : "rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            }
          >
            {option.text}
          </Link>
        );
      })}
    </nav>
  );
}
