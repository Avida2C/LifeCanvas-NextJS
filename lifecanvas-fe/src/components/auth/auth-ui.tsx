"use client";

import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import type { Theme } from "@/lib/theme";

function cx(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Shared auth page shell used by login/register screens. */
export function AuthScreen({
  theme,
  children,
  className,
}: {
  theme: Theme;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("flex min-h-dvh w-full flex-col", className)}
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {children}
    </div>
  );
}

export function AuthInput({
  theme,
  className,
  onFocus,
  onBlur,
  style,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { theme: Theme }) {
  const [focused, setFocused] = useState(false);
  const incomingStyle = style && typeof style === "object" ? style : {};
  return (
    <input
      {...props}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      className={cx(
        "w-full rounded-xl border-2 px-3 py-2.5 text-base outline-none transition-[border-color,box-shadow]",
        "placeholder:opacity-60",
        className,
      )}
      style={{
        ...incomingStyle,
        borderColor: focused ? theme.primary : theme.border,
        backgroundColor: theme.surface,
        color: theme.text,
        boxShadow: focused ? `0 0 0 3px ${theme.primary}28` : undefined,
      }}
    />
  );
}

export function AuthPrimaryButton({
  theme,
  className,
  children,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { theme: Theme; children: ReactNode }) {
  const incomingStyle = style && typeof style === "object" ? style : {};
  return (
    <button
      {...props}
      className={cx(
        "flex h-11 w-full items-center justify-center rounded-xl text-base font-semibold shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        ...incomingStyle,
        backgroundColor: theme.primary,
        color: theme.avatarText,
      }}
    >
      {children}
    </button>
  );
}

export function AuthOutlineButton({
  theme,
  className,
  children,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { theme: Theme; children: ReactNode }) {
  const incomingStyle = style && typeof style === "object" ? style : {};
  return (
    <button
      {...props}
      className={cx(
        "flex h-10 w-full items-center justify-center rounded-xl border-2 text-base font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        ...incomingStyle,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        color: theme.primary,
      }}
    >
      {children}
    </button>
  );
}
