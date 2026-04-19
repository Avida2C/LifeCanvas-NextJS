"use client";

import type { ReactNode } from "react";
import { Trash2, X } from "lucide-react";
import type { Theme } from "@/lib/theme";

export function DestructiveConfirmDialog({
  theme,
  open,
  titleId,
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel = "Delete",
}: {
  theme: Theme;
  open: boolean;
  titleId: string;
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border-2 p-4 shadow-xl"
        style={{ backgroundColor: theme.card, borderColor: theme.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <p id={titleId} className="font-bold" style={{ color: theme.text }}>
          {title}
        </p>
        <div
          className="mt-2 text-sm leading-relaxed"
          style={{ color: theme.textSecondary }}
        >
          {children}
        </div>
        <div
          className="mt-4 flex flex-nowrap justify-end gap-2 border-t pt-3"
          style={{ borderColor: theme.divider }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-w-0 items-center justify-center gap-1 rounded-lg border-2 px-3 py-2 text-sm font-medium"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            <X className="size-4 shrink-0" aria-hidden />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="inline-flex min-w-0 items-center justify-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white"
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
