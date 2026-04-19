import { Suspense } from "react";
import { SignUpClient } from "./sign-up-client";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-white text-sm text-[#555]">
          Loading…
        </div>
      }
    >
      <SignUpClient />
    </Suspense>
  );
}
