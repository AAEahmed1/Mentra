"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() =>
        signOut({
          fetchOptions: {
            onSuccess: () => router.push("/sign-in"),
          },
        })
      }
    >
      Sign out
    </Button>
  );
}
