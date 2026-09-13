import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, hasGoogleAuth } from "@/lib/auth";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Mentra — What to work on tonight, and why",
  description:
    "Mentra keeps a student's courses, deadlines and notes in one place and prints one page from them: the work that matters most right now, with the reason underneath.",
};

/**
 * The front door. A student who is signed in goes straight to today's page;
 * anyone else reads the edition's front matter — what Mentra is, printed the
 * way Mentra prints — with the way in at the top.
 */
export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingPage now={new Date()} googleSignIn={hasGoogleAuth} />;
}
