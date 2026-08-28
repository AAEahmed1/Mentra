import Link from "next/link";

/** A route that doesn't exist, or a record that isn't this student's. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <div className="border-l border-primary pl-5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          There&apos;s nothing here.
        </h1>
        <p className="mt-2 max-w-[55ch] text-sm text-muted-foreground">
          This page doesn&apos;t exist, or what it pointed at has been deleted.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Back to today
        </Link>
        <Link
          href="/chats"
          className="rounded-md border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Your chats
        </Link>
      </div>
    </main>
  );
}
