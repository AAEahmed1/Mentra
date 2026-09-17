import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/session";
import { getProfile } from "@/lib/services/profile";
import { AppShell } from "@/components/app-shell";
import { RunningHead } from "@/components/running-head";
import { ProfileForm } from "@/components/profile/profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export const metadata: Metadata = {
  title: "Profile — Mentra",
};

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
};

export default async function ProfilePage() {
  const userId = await requireUserId();
  const profile = await getProfile(userId);

  if (!profile) {
    redirect("/sign-in");
  }

  const providerNames = profile.socialProviders.map(
    (id) => PROVIDER_NAMES[id] ?? id,
  );

  return (
    <AppShell title="Profile" lede="Your details, and how you sign in.">
      <section className="flex flex-col gap-4">
        <RunningHead>Details</RunningHead>
        <ProfileForm
          name={profile.name}
          program={profile.program}
          institution={profile.institution}
        />
      </section>

      <section className="flex flex-col gap-4">
        <RunningHead>Sign-in</RunningHead>
        <dl className="flex max-w-md flex-col gap-1 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium break-all">{profile.email}</dd>
        </dl>
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          {providerNames.length > 0
            ? `You sign in with ${providerNames.join(" and ")}, so your email comes from there.`
            : "Your email can't be changed here yet."}
        </p>
      </section>

      {profile.hasPassword && (
        <section className="flex flex-col gap-4">
          <RunningHead>Change password</RunningHead>
          <ChangePasswordForm />
        </section>
      )}
    </AppShell>
  );
}
