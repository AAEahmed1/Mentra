import Link from "next/link";

import {
  COURSE_SORT_LABEL,
  COURSE_SORTS,
  DEFAULT_COURSE_SORT,
  type CourseSort,
} from "@/lib/course-sort";

/**
 * How the courses in every term are ordered. A link per choice, the same
 * control as the dashboard's time filter, so the order lives in the URL.
 */
export function CourseSortControl({ selected }: { selected: CourseSort }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span id="course-sort-label" className="text-xs text-muted-foreground">
        Sort by
      </span>
      <nav
        aria-labelledby="course-sort-label"
        className="flex items-center border border-rule-strong"
      >
        {COURSE_SORTS.map((sort) => {
          const active = sort === selected;

          return (
            <Link
              key={sort}
              href={
                sort === DEFAULT_COURSE_SORT
                  ? "/courses"
                  : `/courses?sort=${sort}`
              }
              aria-current={active ? "true" : undefined}
              // Re-sorting is a view change, not a new page to scroll to.
              scroll={false}
              className={
                active
                  ? "bg-plate-now px-2 py-1 text-xs font-semibold text-plate-now-ink not-first:border-l not-first:border-rule-strong"
                  : "px-2 py-1 text-xs text-muted-foreground transition-colors not-first:border-l not-first:border-rule-strong hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              }
            >
              {COURSE_SORT_LABEL[sort]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
