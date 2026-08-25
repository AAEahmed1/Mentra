import type { Metadata } from "next";

import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { greetingForHour } from "@/lib/greeting";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard — Mentra",
};

export default async function DashboardPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, program: true },
  });

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="min-h-svh bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-sm font-medium tracking-wide text-primary">
          Mentra
        </span>
        <SignOutButton />
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold text-balance">
            {greeting}, {user?.name}.
          </h1>
          {user?.program && (
            <p className="mt-1 text-sm text-muted-foreground">
              {user.program}
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              Recommended for tonight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once you add courses and tasks, Mentra will rank what matters
              most right here.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
