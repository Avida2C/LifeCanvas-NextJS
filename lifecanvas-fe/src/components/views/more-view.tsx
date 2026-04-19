"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  Heart,
  ImageUp,
  LogOut,
  PenLine,
  Scale,
  Settings,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import { clearUserSettings } from "@/lib/storage";
import { ACCENT_OPTIONS } from "@/lib/theme";

/**
 * Figma node 311:11792 — More / sidebar menu.
 * @see https://www.figma.com/design/Vc5J5T06DemOLwe85aibl3/LifeCanvas--Daily-Gratitude---Journaling-?node-id=311-11792
 */
const links = [
  {
    href: "/settings",
    title: "Settings",
    subtitle: "Preferences and account",
    Icon: Settings,
  },
] as const;

const libraryLinks = [
  {
    href: "/created-by-me",
    title: "Created by me",
    subtitle: "Your affirmations and profile quote",
    Icon: PenLine,
  },
  {
    href: "/favorites",
    title: "Favorites",
    subtitle: "Quotes and affirmations you have hearted",
    Icon: Heart,
  },
  {
    href: "/media",
    title: "Uploaded Media",
    subtitle: "Photos and videos in your gallery",
    Icon: ImageUp,
  },
] as const;

const legalLinks = [
  {
    href: "/terms",
    title: "Terms and Conditions",
    subtitle: "Rules for using Life Canvas",
    Icon: Scale,
  },
  {
    href: "/privacy",
    title: "Privacy Policy",
    subtitle: "How we handle your data",
    Icon: Shield,
  },
] as const;

function SectionLabel({
  children,
  theme,
}: {
  children: ReactNode;
  theme: { textSecondary: string };
}) {
  return (
    <p
      className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
      style={{ color: theme.textSecondary }}
    >
      {children}
    </p>
  );
}

function MenuCard({
  children,
  theme,
}: {
  children: ReactNode;
  theme: { card: string; border: string };
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border shadow-sm"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.border,
        boxShadow: `0 1px 0 ${theme.border}22`,
      }}
    >
      {children}
    </div>
  );
}

export function MoreView({
  onDismiss,
  onNavigate,
}: {
  onDismiss?: () => void;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { theme, isDarkMode, toggleTheme, accentId, setAccent } = useTheme();

  const handleSignOut = async () => {
    await clearUserSettings();
    onDismiss?.();
    router.replace("/login");
  };

  const rowLink = (
    href: string,
    title: string,
    subtitle: string,
    Icon: LucideIcon,
    rowKey: string,
    showDivider: boolean,
  ) => (
    <Link
      key={rowKey}
      href={href}
      onClick={() => onNavigate?.()}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      style={{
        borderTop: showDivider ? `1px solid ${theme.divider}` : undefined,
      }}
    >
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${theme.primary}14`,
          color: theme.primary,
        }}
      >
        <Icon className="size-[22px]" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-tight" style={{ color: theme.text }}>
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-snug" style={{ color: theme.textSecondary }}>
          {subtitle}
        </p>
      </div>
      <ChevronRight
        className="size-4 shrink-0 opacity-50"
        style={{ color: theme.textSecondary }}
        aria-hidden
      />
    </Link>
  );

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <header
        className="flex shrink-0 items-start justify-between gap-3 border-b px-4 pb-4 pt-3"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.divider,
        }}
      >
        <div className="min-w-0 pt-0.5">
          <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight">More</h1>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            Library, appearance, account, and legal
          </p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            style={{
              backgroundColor: theme.background,
              color: theme.textSecondary,
              boxShadow: `inset 0 0 0 1px ${theme.divider}`,
            }}
            aria-label="Close menu"
          >
            <X className="size-5" strokeWidth={2.25} />
          </button>
        ) : null}
      </header>

      <nav
        className="flex min-h-0 flex-1 flex-col px-4 mt-4"
        aria-label="More menu"
      >
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
          <section>
            <SectionLabel theme={theme}>Library</SectionLabel>
            <MenuCard theme={theme}>
              {libraryLinks.map(({ href, title, subtitle, Icon }, i) =>
                rowLink(href, title, subtitle, Icon, href, i > 0),
              )}
            </MenuCard>
          </section>

          <section>
            <SectionLabel theme={theme}>Appearance</SectionLabel>
            <MenuCard theme={theme}>
              <div
                className="flex items-center justify-between gap-3 px-4 py-3.5"
                style={{ borderBottom: `1px solid ${theme.divider}` }}
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold" style={{ color: theme.text }}>
                    Dark mode
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: theme.textSecondary }}>
                    {isDarkMode ? "On" : "Off"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleTheme()}
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme.primary }}
                >
                  Toggle
                </button>
              </div>
              <div className="px-4 pb-3 pt-3">
                <p
                  className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: theme.textSecondary }}
                >
                  Accent color
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {ACCENT_OPTIONS.map(({ id, label, swatch }) => {
                    const selected = accentId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => void setAccent(id)}
                        className="flex flex-col items-center gap-1.5 rounded-xl border px-1.5 py-2 transition-opacity hover:opacity-95"
                        style={{
                          borderColor: selected ? theme.primary : theme.divider,
                          backgroundColor: theme.surface,
                          color: theme.text,
                          boxShadow: selected
                            ? `0 0 0 2px ${theme.primary}33`
                            : undefined,
                        }}
                        aria-pressed={selected}
                        aria-label={`${label} accent`}
                      >
                        <span
                          className="size-8 rounded-full border-2 shadow-sm"
                          style={{
                            backgroundColor: swatch,
                            borderColor: selected ? theme.primary : theme.divider,
                          }}
                        />
                        <span className="text-[0.65rem] font-semibold leading-none">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </MenuCard>
          </section>

          <section>
            <SectionLabel theme={theme}>Account</SectionLabel>
            <MenuCard theme={theme}>
              {links.map(({ href, title, subtitle, Icon }, i) =>
                rowLink(href, title, subtitle, Icon, href, i > 0),
              )}
            </MenuCard>
          </section>

          <section>
            <SectionLabel theme={theme}>Legal</SectionLabel>
            <MenuCard theme={theme}>
              {legalLinks.map(({ href, title, subtitle, Icon }, i) =>
                rowLink(href, title, subtitle, Icon, href, i > 0),
              )}
            </MenuCard>
          </section>
        </div>

        <div className="mt-2 shrink-0 pt-2 pb-4 border-primary-200">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-opacity hover:opacity-90"
            style={{
              borderColor: theme.error,
              backgroundColor: theme.surface,
              color: theme.error,
            }}
          >
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${theme.error}18`,
                color: theme.error,
              }}
            >
              <LogOut className="size-[22px]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Sign out</p>
              <p className="mt-0.5 text-xs opacity-90">Return to the login screen</p>
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
}
