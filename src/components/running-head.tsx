import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The running head — how every region of every page opens.
 *
 * A short tracked label, then the thick-thin rule pair running to the end of
 * the measure. It labels a region of the page; it is never a kicker above a
 * heading, and it always carries its rule. `tone="now"` inks the pair in the
 * live plate and is reserved for the region that *is* now; `tone="danger"`
 * inks it in the second plate, only where the region destroys something.
 */
export function RunningHead({
  children,
  id,
  as: Tag = "h2",
  tone = "quiet",
  trailing,
}: {
  children: ReactNode;
  id?: string;
  as?: "h2" | "h3";
  tone?: "quiet" | "now" | "danger";
  trailing?: ReactNode;
}) {
  return (
    <div className="running-head">
      <Tag
        id={id}
        className={cn(
          "font-sans shrink-0",
          tone === "now"
            ? "text-now"
            : tone === "danger"
              ? "text-destructive"
              : "text-muted-foreground"
        )}
      >
        {children}
      </Tag>
      <span
        aria-hidden="true"
        className={cn(
          "rule-pair",
          tone === "now" && "rule-pair-now",
          tone === "danger" && "rule-pair-danger"
        )}
      />
      {trailing}
    </div>
  );
}
