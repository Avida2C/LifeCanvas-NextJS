"use client";

import { useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { getFavorites, STORAGE_KEY_NAMES } from "@/lib/storage";

/** Local troubleshooting tools for inspecting persisted browser data. */
export function DebugView() {
  const { theme } = useTheme();
  const [output, setOutput] = useState("");

  const viewFavorites = async () => {
    try {
      if (typeof window === "undefined") return;
      const data = window.localStorage.getItem("@lifecanvas_favorites");
      if (!data) {
        setOutput("No favorites key");
        return;
      }
      const parsed = JSON.parse(data) as string[];
      let o = `Found ${parsed.length} favorites:\n\n`;
      parsed.forEach((item, index) => {
        o += `[${index}] `;
        try {
          const q = JSON.parse(item) as { quote: string; author: string };
          o += `JSON: "${q.quote}" — ${q.author}\n`;
        } catch {
          o += `plain: "${item}"\n`;
        }
      });
      setOutput(o);
    } catch (e) {
      setOutput(String(e));
    }
  };

  const clearFavorites = async () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("@lifecanvas_favorites");
    window.localStorage.removeItem("@lifecanvas_default_quote");
    setOutput("Favorites cleared.");
  };

  const viewKeys = () => {
    if (typeof window === "undefined") return;
    const lines: string[] = [];
    for (const k of STORAGE_KEY_NAMES) {
      const v = window.localStorage.getItem(k);
      lines.push(`${k}: ${v ? `${v.length} chars` : "(empty)"}`);
    }
    setOutput(lines.join("\n"));
  };

  const testMigration = async () => {
    const favorites = await getFavorites();
    let o = `getFavorites(): ${favorites.length} items\n`;
    favorites.forEach((item, i) => {
      try {
        const p = JSON.parse(item) as { quote: string };
        o += `[${i}] ${p.quote?.slice(0, 40)}…\n`;
      } catch {
        o += `[${i}] raw\n`;
      }
    });
    setOutput(o);
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader title="Debug tools" theme={theme} />
      <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-24">
        <button
          type="button"
          onClick={() => void viewFavorites()}
          className="block w-full rounded-lg py-3 font-semibold text-white"
          style={{ backgroundColor: theme.primary }}
        >
          View favorites (raw)
        </button>
        <button
          type="button"
          onClick={viewKeys}
          className="block w-full rounded-lg py-3 font-semibold text-white"
          style={{ backgroundColor: theme.primary }}
        >
          View storage keys
        </button>
        <button
          type="button"
          onClick={() => void testMigration()}
          className="block w-full rounded-lg py-3 font-semibold text-white"
          style={{ backgroundColor: theme.primary }}
        >
          Test getFavorites()
        </button>
        <button
          type="button"
          onClick={() => void clearFavorites()}
          className="block w-full rounded-lg border-2 py-3 font-semibold"
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          Clear favorites
        </button>
        {output ? (
          <pre
            className="whitespace-pre-wrap rounded-lg border p-3 text-xs"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
          >
            {output}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
