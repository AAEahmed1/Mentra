import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-16">
      <Card className="w-full max-w-md overflow-hidden py-0">
        <div className="bg-accent px-6 py-8 text-accent-foreground">
          <p className="text-sm font-medium tracking-wide">Mentra</p>
          <h1 className="mt-2 text-2xl font-semibold text-balance">
            Let&apos;s get to know your academic life.
          </h1>
          <p className="mt-2 text-sm text-accent-foreground/80">
            Just the basics for now — you can add courses and details as you
            go.
          </p>
        </div>
        <CardContent className="py-6">
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
