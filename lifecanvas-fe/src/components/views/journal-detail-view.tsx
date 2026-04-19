"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DestructiveConfirmDialog } from "@/components/destructive-confirm-dialog";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { deleteJournalEntry, getJournalEntries } from "@/lib/storage";
import type { JournalEntry } from "@/types";

export function JournalDetailView({ id }: { id: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      const entries = await getJournalEntries();
      setEntry(entries.find((e) => e.id === id) ?? null);
    })();
  }, [id]);

  if (entry === undefined) {
    return <div className="p-6 text-sm">Loading…</div>;
  }

  if (!entry) {
    return (
      <div className="p-6">
        <ScreenHeader title="Not found" theme={theme} />
        <p className="mt-4">Journal entry not found.</p>
      </div>
    );
  }

  const createdAt = new Date(entry.createdAt);
  const updatedAt = new Date(entry.updatedAt || entry.createdAt);
  const updated = updatedAt.getTime() !== createdAt.getTime();

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title="Journal"
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
            onClick: () => setDeleteConfirmOpen(true),
          },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 border-b-2 pb-3" style={{ borderColor: theme.border }}>
          <h1 className="text-xl font-bold">{entry.title}</h1>
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            {updated ? "Updated: " : "Created: "}
            {updated ? updatedAt.toLocaleString() : createdAt.toLocaleString()}
          </p>
        </div>
        <div
          className="border-2 p-4"
          style={{ borderColor: theme.border, backgroundColor: theme.card }}
        >
          <MarkdownRenderer content={entry.content} imageSources={entry.images} />
        </div>
      </div>

      <DestructiveConfirmDialog
        theme={theme}
        open={deleteConfirmOpen}
        titleId="confirm-delete-journal-title"
        title="Delete this journal entry?"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          await deleteJournalEntry(id);
          setDeleteConfirmOpen(false);
          router.back();
        }}
      >
        This journal entry will be permanently removed. This cannot be undone.
      </DestructiveConfirmDialog>
    </div>
  );
}
