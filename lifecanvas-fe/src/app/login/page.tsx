import { Suspense } from "react";
import { LoginClient } from "./login-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
          Loading…
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
