"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUserSettings } from "@/lib/storage";

/** Route guard that redirects unauthenticated users to login. */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getUserSettings();
      if (cancelled) return;
      if (!settings?.name) {
        router.replace(`/login?next=${encodeURIComponent(pathname ?? "/me")}`);
        return;
      }
      setAllowed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
        Loading…
      </div>
    );
  }

  return children;
}
