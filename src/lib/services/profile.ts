import { prisma } from "@/lib/prisma";
import type { OnboardingInput } from "@/lib/onboarding";
import type { ProfileInput } from "@/lib/profile";

/** better-auth stores email-and-password sign-ins under this provider id. */
const PASSWORD_PROVIDER = "credential";

export type Profile = {
  name: string;
  email: string;
  image: string | null;
  program: string | null;
  institution: string | null;
  /** Signed up with email and password, so the password can be changed here. */
  hasPassword: boolean;
  /** Social providers linked to the account, e.g. "google". */
  socialProviders: string[];
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      program: true,
      institution: true,
      accounts: { select: { providerId: true } },
    },
  });

  if (!user) return null;

  const providers = user.accounts.map((account) => account.providerId);

  return {
    name: user.name,
    email: user.email,
    image: user.image,
    program: user.program,
    institution: user.institution,
    hasPassword: providers.includes(PASSWORD_PROVIDER),
    socialProviders: providers.filter((id) => id !== PASSWORD_PROVIDER),
  };
}

/**
 * Only the fields a student can edit themselves. Email is deliberately absent:
 * changing it needs a verification email, which Mentra doesn't send yet.
 */
export async function updateProfile(
  userId: string,
  input: ProfileInput,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      program: input.program,
      institution: input.institution,
    },
  });
}

/**
 * Saves what a student says they study during onboarding. Fields left blank
 * there are skipped rather than cleared; the profile page is where they clear.
 */
export async function completeOnboarding(
  userId: string,
  input: OnboardingInput,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: input,
  });
}
