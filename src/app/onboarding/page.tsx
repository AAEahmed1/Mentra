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
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight">Mentra</span>
          <span aria-hidden="true" className="h-px flex-1 bg-rule" />
        </div>

        <div className="mt-10 border-l border-primary pl-5">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance">
            First, what are you studying?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Just the basics. You can add courses and everything else as you go.
          </p>
        </div>

        <div className="mt-8">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
