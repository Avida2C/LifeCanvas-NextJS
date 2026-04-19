import { DEFAULT_ACCENT } from "@/lib/theme";
import type { UserSettings } from "@/types";

/**
 * Built-in demo profile for local / staging use — no signup or backend required.
 * Log in with the email and password below to load this profile.
 */
export const DEMO_ACCOUNT = {
  username: "canvas_explorer",
  nickname: "Demo Explorer",
  email: "demo@lifecanvas.app",
  password: "LifeCanvasDemo!",
} as const;

export function isDemoLogin(email: string, password: string): boolean {
  const e = email.trim().toLowerCase();
  const p = password;
  return (
    e === DEMO_ACCOUNT.email.toLowerCase() && p === DEMO_ACCOUNT.password
  );
}

export function buildDemoUserSettings(
  existing: UserSettings | null,
): UserSettings {
  const memberSince =
    existing?.memberSince ?? new Date().getFullYear().toString();
  return {
    name: DEMO_ACCOUNT.nickname,
    nickname: DEMO_ACCOUNT.nickname,
    username: DEMO_ACCOUNT.username,
    email: DEMO_ACCOUNT.email,
    darkMode: existing?.darkMode ?? false,
    accentColor: existing?.accentColor ?? DEFAULT_ACCENT,
    memberSince,
    timezone: existing?.timezone,
  };
}
