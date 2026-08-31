import Link from "next/link";

/** A route that doesn't exist, or a record that isn't this student's. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
          There&apos;s nothing here.
        </h1>
        <p className="mt-2 max-w-[55ch] text-sm text-muted-foreground">
          This page doesn&apos;t exist, or what it pointed at has been deleted.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className="rounded-xs bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Back to today
        </Link>
        <Link
          href="/chats"
          className="rounded-xs border border-rule-strong px-3.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Your chats
        </Link>
      </div>
    </main>
  );
}
