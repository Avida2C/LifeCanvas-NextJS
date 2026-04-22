"use client";

import { ArrowLeft, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Theme } from "@/lib/theme";

/** Standard sticky header with back action and optional trailing actions. */
export function ScreenHeader({
  title,
  theme,
  actions,
}: {
  title: string;
  theme: Theme;
  actions?: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean }[];
}) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-1 border-b-2 px-1 py-1 shadow-sm"
      style={{ backgroundColor: theme.primary, borderColor: theme.border }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-lg p-2 text-white hover:bg-white/10"
        aria-label="Back"
      >
        <ArrowLeft className="size-6" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-white">{title}</h1>
      <div className="flex shrink-0 items-center">
        {actions?.map(({ icon: Icon, label, onClick, disabled }) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="rounded-lg p-2 text-white hover:bg-white/10 disabled:opacity-40"
            aria-label={label}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </div>
    </header>
  );
}
