"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { parseAccentId } from "@/lib/theme";
import { getUserSettings, saveUserSettings } from "@/lib/storage";
import type { UserSettings } from "@/types";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

export function SettingsView() {
  const { theme, accentId } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    name: "",
    username: "",
    nickname: "",
    email: "",
    darkMode: false,
    memberSince: new Date().getFullYear().toString(),
  });
  const [loading, setLoading] = useState(false);
  const [tzOpen, setTzOpen] = useState(false);
  const [tzSearch, setTzSearch] = useState("");

  useEffect(() => {
    void (async () => {
      const s = await getUserSettings();
      if (s)
        setSettings({
          ...s,
          username: s.username ?? "",
          nickname: s.nickname ?? s.name ?? "",
          email: s.email ?? "",
          accentColor: parseAccentId(s.accentColor),
        });
    })();
  }, []);

  const saveProfile = async () => {
    const nickname = (settings.nickname ?? settings.name).trim();
    if (!nickname) {
      alert("Please enter a nickname / display name");
      return;
    }
    setLoading(true);
    const username = settings.username?.trim() || undefined;
    const email = settings.email?.trim() || undefined;
    const next: UserSettings = {
      ...settings,
      name: nickname,
      nickname,
      username,
      email,
      accentColor: accentId,
    };
    await saveUserSettings(next);
    setSettings((prev) => ({ ...prev, ...next }));
    setLoading(false);
    alert("Profile updated.");
  };

  const tzLabel = () => {
    if (!settings.timezone) {
      const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const info = TIMEZONES.find((t) => t.value === device);
      return `Automatic (${info?.label || device})`;
    }
    return TIMEZONES.find((t) => t.value === settings.timezone)?.label || settings.timezone;
  };

  const filteredTz = TIMEZONES.filter(
    (t) =>
      t.label.toLowerCase().includes(tzSearch.toLowerCase()) ||
      t.value.toLowerCase().includes(tzSearch.toLowerCase()),
  );

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader title="Settings" theme={theme} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
        <section
          className="rounded-lg border-2 p-4"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <h2 className="font-bold" style={{ color: theme.text }}>
            Personal
          </h2>
          <label className="mt-2 block text-sm" style={{ color: theme.textSecondary }}>
            Username
          </label>
          <input
            value={settings.username ?? ""}
            onChange={(e) => setSettings({ ...settings, username: e.target.value })}
            className="mt-1 w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            autoComplete="username"
          />
          <label className="mt-3 block text-sm" style={{ color: theme.textSecondary }}>
            Nickname
          </label>
          <input
            value={settings.nickname ?? settings.name}
            onChange={(e) =>
              setSettings({ ...settings, nickname: e.target.value, name: e.target.value })
            }
            className="mt-1 w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            autoComplete="nickname"
          />
          <label className="mt-3 block text-sm" style={{ color: theme.textSecondary }}>
            Email
          </label>
          <input
            type="email"
            value={settings.email ?? ""}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            className="mt-1 w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            autoComplete="email"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => void saveProfile()}
            className="mt-2 rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: theme.primary }}
          >
            Save
          </button>
          {settings.memberSince && (
            <p className="mt-2 text-xs italic" style={{ color: theme.textSecondary }}>
              Member since {settings.memberSince}
            </p>
          )}
        </section>

        <button
          type="button"
          onClick={() => setTzOpen(true)}
          className="flex w-full items-center justify-between rounded-lg border-2 p-4 text-left"
          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
        >
          <div>
            <p className="font-medium">Timezone</p>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              {tzLabel()}
            </p>
          </div>
          <span style={{ color: theme.textSecondary }}>›</span>
        </button>

        <Link
          href="/favorites"
          className="flex w-full items-center justify-between rounded-lg border-2 p-4"
          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
        >
          <span className="font-medium">Favorite inspirations</span>
          <span style={{ color: theme.textSecondary }}>›</span>
        </Link>

        <Link
          href="/debug"
          className="flex w-full items-center justify-between rounded-lg border-2 p-4"
          style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}
        >
          <span className="font-medium">Debug tools</span>
          <span style={{ color: theme.textSecondary }}>›</span>
        </Link>

        <div
          className="rounded-lg border-2 p-4"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <p className="font-medium" style={{ color: theme.text }}>
            Life Canvas
          </p>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            v1.0.0 (Web)
          </p>
        </div>
      </div>

      {tzOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center">
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-2 p-4 sm:rounded-2xl"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            <div className="mb-3 flex items-center justify-between border-b pb-2" style={{ borderColor: theme.border }}>
              <h3 className="font-bold" style={{ color: theme.text }}>
                Timezone
              </h3>
              <button type="button" onClick={() => setTzOpen(false)} aria-label="Close">
                <X className="size-6" style={{ color: theme.textSecondary }} />
              </button>
            </div>
            <input
              type="search"
              value={tzSearch}
              onChange={(e) => setTzSearch(e.target.value)}
              placeholder="Search…"
              className="mb-3 w-full rounded border-2 px-3 py-2"
              style={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
            />
            <button
              type="button"
              className="mb-2 w-full rounded-lg border-2 p-3 text-left font-semibold"
              style={{
                borderColor: !settings.timezone ? theme.primary : theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
              }}
              onClick={async () => {
                const next = { ...settings, timezone: undefined, accentColor: accentId };
                setSettings(next);
                await saveUserSettings(next);
                setTzOpen(false);
              }}
            >
              Automatic (device)
            </button>
            {filteredTz.map((t) => (
              <button
                key={t.value}
                type="button"
                className="mb-1 w-full rounded-lg border p-2 text-left text-sm"
                style={{
                  borderColor:
                    settings.timezone === t.value ? theme.primary : theme.border,
                  backgroundColor: theme.surface,
                  color: theme.text,
                }}
                onClick={async () => {
                  const next = { ...settings, timezone: t.value, accentColor: accentId };
                  setSettings(next);
                  await saveUserSettings(next);
                  setTzOpen(false);
                }}
              >
                {t.label}
                <span className="block text-xs" style={{ color: theme.textSecondary }}>
                  {t.value}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
