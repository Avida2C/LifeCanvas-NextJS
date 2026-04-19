"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { getJournalEntries } from "@/lib/storage";
import type { JournalEntry } from "@/types";

export function JournalsListView() {
  const { theme } = useTheme();
  const router = useRouter();
  const [allJournals, setAllJournals] = useState<JournalEntry[]>([]);
  const [q, setQ] = useState("");

  const journals = useMemo(() => {
    if (!q.trim()) return allJournals;
    const qq = q.toLowerCase();
    return allJournals.filter(
      (j) =>
        j.title.toLowerCase().includes(qq) ||
        j.content.toLowerCase().includes(qq),
    );
  }, [allJournals, q]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await getJournalEntries();
      if (cancelled) return;
      setAllJournals(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title={`My journals (${journals.length})`}
        theme={theme}
        actions={[
          {
            icon: Plus,
            label: "New journal",
            onClick: () => router.push("/editor?type=journal"),
          },
        ]}
      />
      <div className="border-b-2 p-3" style={{ borderColor: theme.border, backgroundColor: theme.card }}>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search journal entries…"
          className="w-full rounded-lg border-2 px-3 py-2"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.text,
          }}
        />
      </div>
      <div className="flex-1">
        {allJournals.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl">📖</p>
            <p className="mt-2 font-bold" style={{ color: theme.text }}>
              No journal entries yet
            </p>
          </div>
        ) : journals.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl">🔍</p>
            <p className="mt-2 font-bold">No matches</p>
          </div>
        ) : (
          journals.map((journal) => {
            const createdAt = new Date(journal.createdAt);
            const updatedAt = new Date(journal.updatedAt || journal.createdAt);
            const updated = updatedAt.getTime() !== createdAt.getTime();
            return (
              <Link
                key={journal.id}
                href={`/journal/${journal.id}`}
                className="flex items-center justify-between border-b-2 px-4 py-4"
                style={{ borderColor: theme.border, backgroundColor: theme.card }}
              >
                <div className="min-w-0">
                  <p className="font-bold" style={{ color: theme.text }}>
                    {journal.title}
                  </p>
                  <p className="text-xs" style={{ color: theme.textSecondary }}>
                    {updated ? "Updated: " : "Created: "}
                    {updated ? updatedAt.toLocaleString() : createdAt.toLocaleString()}
                  </p>
                </div>
                <span className="text-2xl" style={{ color: theme.primary }}>
                  ›
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
