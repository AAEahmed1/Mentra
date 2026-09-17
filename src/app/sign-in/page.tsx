import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { hasGoogleAuth } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = {
  title: "Sign in — Mentra",
};

export default async function SignInPage() {
  const session = await getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell title="Welcome back" description="Sign in to Mentra.">
      <div className="flex flex-col gap-5">
        {hasGoogleAuth && (
          <>
            <GoogleSignInButton label="Sign in with Google" />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <SignInForm />
      </div>
    </AuthShell>
  );
}
