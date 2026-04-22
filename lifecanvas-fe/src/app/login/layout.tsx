import type { ReactNode } from "react";

/** Isolated shell for all auth routes under `/login`. */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
