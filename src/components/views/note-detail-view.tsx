"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DestructiveConfirmDialog } from "@/components/destructive-confirm-dialog";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { deleteNote, getNotes, getPhotos } from "@/lib/storage";
import type { Note } from "@/types";

export function NoteDetailView({ id }: { id: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [note, setNote] = useState<Note | null | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageSources, setImageSources] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const notes = await getNotes();
      setNote(notes.find((n) => n.id === id) ?? null);
    })();
  }, [id]);

  useEffect(() => {
    const imageRefs = note?.images ?? [];
    if (!imageRefs.length) return;
    void (async () => {
      const photos = await getPhotos();
      const byId = new Map(photos.map((p) => [p.id, p.uri]));
      // Resolve stored media ids to current URIs; preserve legacy inline data URLs.
      setImageSources(
        imageRefs
          .map((ref) =>
            ref.startsWith("data:image/") || ref.startsWith("data:video/")
              ? ref
              : byId.get(ref),
          )
          .filter((x): x is string => Boolean(x)),
      );
    })();
  }, [note]);

  if (note === undefined) {
    return <div className="p-6 text-sm">Loading…</div>;
  }

  if (!note) {
    return (
      <div className="p-6">
        <ScreenHeader title="Not found" theme={theme} />
        <p className="mt-4">Note not found.</p>
      </div>
    );
  }

  const createdAt = new Date(note.createdAt);
  const updatedAt = new Date(note.updatedAt || note.createdAt);
  const updated = updatedAt.getTime() !== createdAt.getTime();

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title="Note"
        theme={theme}
        actions={[
          {
            icon: Pencil,
            label: "Edit",
            onClick: () => router.push(`/editor?type=note&id=${id}`),
          },
          {
            icon: Trash2,
            label: "Delete",
            onClick: () => setDeleteConfirmOpen(true),
          },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 pb-3">
          <h1 className="text-xl font-bold">{note.title}</h1>
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            {updated ? "Updated: " : "Created: "}
            {updated ? updatedAt.toLocaleString() : createdAt.toLocaleString()}
          </p>
        </div>
        <div
          className="rounded-2xl border-2 p-5"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          <MarkdownRenderer
            content={note.content}
            imageSources={note.images?.length ? imageSources : []}
          />
        </div>
      </div>

      <DestructiveConfirmDialog
        theme={theme}
        open={deleteConfirmOpen}
        titleId="confirm-delete-note-title"
        title="Delete this note?"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          await deleteNote(id);
          setDeleteConfirmOpen(false);
          router.back();
        }}
      >
        This note will be permanently removed. This cannot be undone.
      </DestructiveConfirmDialog>
    </div>
  );
}
