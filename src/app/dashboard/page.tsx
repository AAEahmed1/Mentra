import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { prisma } from "@/lib/prisma";
import { greetingForHour } from "@/lib/greeting";

export const metadata: Metadata = {
  title: "Dashboard — Mentra",
};

const filedExamples = [
  { title: "Subnetting review", tab: "ontrack" as const, note: "Exam in 6 days" },
  { title: "Database design project", tab: "due" as const, note: "Due in 4 days" },
];

export default async function DashboardPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, program: true },
  });

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="min-h-svh bg-background">
      <AppHeader current="/dashboard" />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-balance">
            {greeting}, {user?.name}.
          </h1>
          {user?.program && (
            <p className="mt-1 text-sm text-muted-foreground">
              {user.program}
            </p>
          )}
        </div>

        <section aria-labelledby="recommended-heading" className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2
              id="recommended-heading"
              className="text-sm font-medium text-muted-foreground"
            >
              Recommended for tonight
            </h2>
            <span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Example — add tasks to see your own
            </span>
          </div>

          <div className="relative mt-6 pb-6">
            {/* fanned filed cards, peeking behind the pulled card */}
            <div
              aria-hidden="true"
              className="absolute top-3 right-2 h-full w-[92%] rotate-[3deg] rounded-lg border border-border bg-card opacity-40"
            />
            <div
              aria-hidden="true"
              className="absolute top-1.5 right-1 h-full w-[96%] rotate-[1.5deg] rounded-lg border border-border bg-card opacity-60"
            />

            {/* pulled card — the top recommendation */}
            <div className="animate-pulled-card relative overflow-visible rounded-lg border border-border bg-card shadow-[0_1px_2px_oklch(0_0_0/0.06),0_12px_28px_-10px_oklch(0_0_0/0.22)]">
              <div className="absolute -top-5 left-6 flex h-5 w-12 items-center justify-center rounded-t-md border border-b-0 border-border bg-muted font-mono text-xs font-medium tracking-wide text-muted-foreground">
                NSEC
              </div>
              <div className="flex items-start gap-3 overflow-hidden rounded-lg bg-cardstock px-5 py-5">
                <div
                  aria-hidden="true"
                  className="mt-1 flex shrink-0 flex-col gap-1.5 opacity-40"
                >
                  <span className="size-1 rounded-full bg-foreground" />
                  <span className="size-1 rounded-full bg-foreground" />
                  <span className="size-1 rounded-full bg-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-serif text-lg leading-snug font-semibold text-balance">
                      Network Security Lab
                    </h3>
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-tab-due px-2.5 py-1 text-xs font-medium text-tab-due-foreground">
                      Due tomorrow
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs tabular-nums-mono text-muted-foreground">
                    55 min · 70% complete
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Recommended because it&apos;s due tomorrow, 70% complete,
                    and similar labs have taken you about 90 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {filedExamples.map((item) => (
              <li
                key={item.title}
                className="flex flex-col gap-1.5 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <span className="text-sm">{item.title}</span>
                <span className="flex items-center gap-2">
                  <span className="whitespace-nowrap font-mono text-xs tabular-nums-mono text-muted-foreground">
                    {item.note}
                  </span>
                  <span
                    className={
                      item.tab === "due"
                        ? "whitespace-nowrap rounded-full bg-tab-due px-2 py-0.5 text-xs font-medium text-tab-due-foreground"
                        : "whitespace-nowrap rounded-full bg-tab-ontrack px-2 py-0.5 text-xs font-medium text-tab-ontrack-foreground"
                    }
                  >
                    {item.tab === "due" ? "Due soon" : "On track"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
