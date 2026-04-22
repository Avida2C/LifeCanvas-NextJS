"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserSettings } from "@/lib/storage";

/** Entry route that forwards users to login or the main app. */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getUserSettings();
      if (cancelled) return;
      // Presence of a stored profile name acts as local "signed-in" state.
      if (settings?.name) {
        router.replace("/me");
      } else {
        router.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
      Loading LifeCanvas…
    </div>
  );
}
