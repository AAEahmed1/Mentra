"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * `collapsed` reduces the control to its icon rather than removing it. A
 * collapsed rail that drops sign-out entirely leaves no way out of the app
 * until you expand it again.
 */
export function SignOutButton({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();

  const leave = () =>
    signOut({
      fetchOptions: { onSuccess: () => router.push("/sign-in") },
    });

  if (collapsed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        title="Sign out"
        onClick={leave}
      >
        <svg
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[18px]"
          aria-hidden="true"
        >
          <path d="M7 15.5H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h3" />
          <path d="M11.5 12 15 9l-3.5-3" />
          <line x1="15" y1="9" x2="7" y2="9" />
        </svg>
      </Button>
    );
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={leave}>
      Sign out
    </Button>
  );
}
