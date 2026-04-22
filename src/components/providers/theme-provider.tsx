"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildTheme,
  DEFAULT_ACCENT,
  parseAccentId,
  type AccentId,
  type Theme,
} from "@/lib/theme";
import { getUserSettings, saveUserSettings } from "@/lib/storage";

type ThemeContextValue = {
  theme: Theme;
  isDarkMode: boolean;
  accentId: AccentId;
  toggleTheme: () => void;
  setAccent: (accent: AccentId) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Loads persisted user theme prefs and exposes theme actions via context. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accentId, setAccentId] = useState<AccentId>(DEFAULT_ACCENT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getUserSettings();
      if (cancelled) return;
      setIsDarkMode(settings?.darkMode ?? false);
      setAccentId(parseAccentId(settings?.accentColor));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode, ready]);

  const toggleTheme = useCallback(async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    const settings = await getUserSettings();
    if (settings) {
      await saveUserSettings({ ...settings, darkMode: next });
    }
  }, [isDarkMode]);

  const setAccent = useCallback(async (accent: AccentId) => {
    setAccentId(accent);
    const settings = await getUserSettings();
    if (settings) {
      await saveUserSettings({ ...settings, accentColor: accent });
    }
  }, []);

  const theme = useMemo(
    () => buildTheme(isDarkMode, accentId),
    [isDarkMode, accentId],
  );

  const value = useMemo(
    () => ({
      theme,
      isDarkMode,
      accentId,
      toggleTheme,
      setAccent,
    }),
    [theme, isDarkMode, accentId, toggleTheme, setAccent],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
