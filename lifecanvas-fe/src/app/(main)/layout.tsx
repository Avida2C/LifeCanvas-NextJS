import type { ReactNode } from "react";
import { AuthGate } from "@/components/layout/auth-gate";
import { MainShell } from "@/components/layout/main-shell";

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
