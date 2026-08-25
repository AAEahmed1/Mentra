import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Set up Mentra",
};

export default async function OnboardingPage() {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { program: true },
  });

  if (user?.program) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_oklch(0_0_0/0.06),0_8px_24px_-8px_oklch(0_0_0/0.18)]">
        <div className="flex items-start gap-3 border-b border-border bg-cardstock px-6 py-6">
          <div
            aria-hidden="true"
            className="mt-1 flex shrink-0 flex-col gap-1.5 opacity-40"
          >
            <span className="size-1 rounded-full bg-foreground" />
            <span className="size-1 rounded-full bg-foreground" />
            <span className="size-1 rounded-full bg-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-xl leading-snug font-semibold text-balance">
              Let&apos;s get to know your academic life.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Just the basics for now — you can add courses and details as you
              go.
            </p>
          </div>
        </div>
        <div className="bg-cardstock px-6 py-6">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
