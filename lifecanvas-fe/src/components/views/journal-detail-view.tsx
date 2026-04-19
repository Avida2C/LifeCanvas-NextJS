"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { deleteJournalEntry, getJournalEntries } from "@/lib/storage";
import type { JournalEntry } from "@/types";

export function JournalDetailView({ id }: { id: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const entries = await getJournalEntries();
      const found = entries.find((e) => e.id === id);
      setEntry(found ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6" style={{ color: theme.text }}>
        Loading…
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6">
        <ScreenHeader title="Not found" theme={theme} />
        <p className="mt-4" style={{ color: theme.text }}>Journal entry not found.</p>
      </div>
    );
  }

  const createdAt = new Date(entry.createdAt);
  const updatedAt = new Date(entry.updatedAt || entry.createdAt);
  const updated = updatedAt.getTime() !== createdAt.getTime();

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title="Journal entry"
        theme={theme}
        actions={[
          {
            icon: Pencil,
            label: "Edit",
            onClick: () => router.push(`/editor?type=journal&id=${id}`),
          },
          {
            icon: Trash2,
            label: "Delete",
            onClick: async () => {
              if (!confirm("Delete this journal entry?")) return;
              await deleteJournalEntry(id);
              router.back();
            },
          },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="mb-3 border-b-2 pb-3"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <h1 className="text-xl font-bold" style={{ color: theme.text }}>
            {entry.title}
          </h1>
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            {updated ? "Updated: " : "Created: "}
            {updated ? updatedAt.toLocaleString() : createdAt.toLocaleString()}
          </p>
        </div>
        <div
          className="border-2 p-4"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <MarkdownRenderer content={entry.content} />
        </div>
      </div>
    </div>
  );
}
