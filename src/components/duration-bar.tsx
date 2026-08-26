/**
 * An estimate drawn as extent, not just written as a number.
 *
 * Two hours should look like twice one hour at a glance — the whole point of
 * putting duration on a line rather than in a sentence. The figure stays
 * alongside for anyone who needs the exact value.
 */

/** The estimate that fills the bar; anything longer is clamped. */
const FULL_SCALE_MINUTES = 240;

export function DurationBar({ minutes }: { minutes: number | null }) {
  if (!minutes) return null;

  const fraction = Math.min(minutes / FULL_SCALE_MINUTES, 1);

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-1 w-10 rounded-full bg-muted sm:w-16"
      >
        <span
          className="block h-full rounded-full bg-muted-foreground/50"
          style={{ width: `${Math.max(fraction * 100, 6)}%` }}
        />
      </span>
      <span data-figures className="text-xs whitespace-nowrap text-muted-foreground">
        {minutes} min
      </span>
    </span>
  );
}
