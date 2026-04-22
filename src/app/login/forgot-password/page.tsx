import { Suspense } from "react";
import { ForgotPasswordClient } from "./forgot-password-client";

/** Server entry for forgot-password flow. */
export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-white text-sm text-[#555]">
          Loading…
        </div>
      }
    >
      <ForgotPasswordClient />
    </Suspense>
  );
}
