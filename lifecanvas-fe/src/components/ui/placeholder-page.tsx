"use client";

import Link from "next/link";
import { useTheme } from "@/components/providers/theme-provider";

/** Temporary scaffold for screens still being migrated from mobile app. */
export function PlaceholderPage({
  title,
  description = "This screen is being ported from the Expo app. Navigation and data layers are wired for Next.js.",
}: {
  title: string;
  description?: string;
}) {
  const { theme } = useTheme();

  return (
    <div className="p-6" style={{ color: theme.text }}>
      <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
        {title}
      </h1>
      <p className="mt-3 max-w-prose text-sm" style={{ color: theme.textSecondary }}>
        {description}
      </p>
      <Link
        href="/me"
        className="mt-6 inline-block text-sm font-medium underline"
        style={{ color: theme.primary }}
      >
        Back to Me
      </Link>
    </div>
  );
}
