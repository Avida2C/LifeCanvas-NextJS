"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { PrivacyPolicyContent } from "./privacy-policy-content";
import { TermsOfServiceContent } from "./terms-of-service-content";

export type LegalModalKind = "terms" | "privacy";

type LegalModalProps = {
  open: boolean;
  kind: LegalModalKind | null;
  onClose: () => void;
};

export function LegalModal({ open, kind, onClose }: LegalModalProps) {
  const { theme } = useTheme();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !kind) return null;

  const title =
    kind === "terms" ? "Terms and Conditions" : "Privacy Policy";
  const Body = kind === "terms" ? TermsOfServiceContent : PrivacyPolicyContent;

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="flex max-h-[min(92dvh,800px)] w-full max-w-lg flex-col rounded-t-2xl border-2 shadow-2xl sm:max-h-[min(85dvh,720px)] sm:rounded-2xl"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-2 border-b-2 px-4 py-3"
          style={{ borderColor: theme.border }}
        >
          <h2 id="legal-modal-title" className="min-w-0 text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:opacity-80"
            style={{ color: theme.textSecondary }}
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
          style={{ color: theme.text }}
        >
          <Body />
        </div>
        <div
          className="shrink-0 border-t-2 px-4 py-3"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-xl text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.primary, color: theme.avatarText }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
