"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { TIME_ZONE_COOKIE } from "@/lib/timezone";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Tells the server which time zone the student is in, so "today", "overdue"
 * and the greeting follow their calendar. Renders nothing. When the zone is new
 * or has changed (travel, daylight saving is handled by the zone itself), the
 * cookie is written and the page re-rendered once with the right day.
 */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;

    const stored = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${TIME_ZONE_COOKIE}=`))
      ?.slice(TIME_ZONE_COOKIE.length + 1);

    if (stored && decodeURIComponent(stored) === timeZone) return;

    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
