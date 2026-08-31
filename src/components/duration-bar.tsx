/**
 * An estimate printed as extent, not just written as a number.
 *
 * Two hours should look like twice one hour at a glance — the whole point of
 * putting duration on a line rather than in a sentence. The figure stays
 * alongside for anyone who needs the exact value.
 *
 * It is squared off rather than rounded, and it sits in a ruled trough: this
 * is a measure printed against a scale, the same object as an entry on the
 * term table, not a progress pill.
 */

/** The estimate that fills the measure; anything longer is clamped. */
const FULL_SCALE_MINUTES = 240;

export function DurationBar({ minutes }: { minutes: number | null }) {
  if (!minutes) return null;

  const fraction = Math.min(minutes / FULL_SCALE_MINUTES, 1);

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-2 w-10 border-b border-rule-strong bg-muted sm:w-16"
      >
        <span
          className="block h-full bg-[color-mix(in_oklab,var(--foreground)_45%,transparent)]"
          style={{ width: `${Math.max(fraction * 100, 6)}%` }}
        />
      </span>
      <span
        data-figures
        className="text-xs whitespace-nowrap text-muted-foreground"
      >
        {minutes} min
      </span>
    </span>
  );
}
