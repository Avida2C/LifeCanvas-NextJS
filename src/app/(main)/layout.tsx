import type { ReactNode } from "react";
import { AuthGate } from "@/components/layout/auth-gate";
import { MainShell } from "@/components/layout/main-shell";

/** Shared authenticated layout for all primary in-app routes. */
export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AuthGate>
      <MainShell>{children}</MainShell>
    </AuthGate>
  );
}
