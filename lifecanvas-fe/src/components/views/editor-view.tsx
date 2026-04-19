"use client";

import { Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { EnhancedTextEditor } from "@/components/enhanced-text-editor";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import {
  getJournalEntries,
  getNotes,
  saveJournalEntry,
  saveNote,
} from "@/lib/storage";
import type { JournalEntry, Note } from "@/types";

function EditorInner() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as "journal" | "note") || "note";
  const id = searchParams.get("id") ?? undefined;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [entryImages, setEntryImages] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      if (type === "journal") {
        const entries = await getJournalEntries();
        const e = entries.find((x) => x.id === id);
        if (e) {
          setTitle(e.title);
          setContent(e.content);
          setEntryImages(e.images || []);
        }
      } else {
        const notes = await getNotes();
        const n = notes.find((x) => x.id === id);
        if (n) {
          setTitle(n.title);
          setContent(n.content);
          setEntryImages(n.images || []);
        }
      }
    })();
  }, [id, type]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    const timestamp = new Date().toISOString();
    if (type === "journal") {
      const prev = id ? (await getJournalEntries()).find((e) => e.id === id) : null;
      const entry: JournalEntry = {
        id: id || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        createdAt: prev?.createdAt ?? timestamp,
        updatedAt: timestamp,
        images: entryImages,
      };
      await saveJournalEntry(entry);
    } else {
      const prev = id ? (await getNotes()).find((n) => n.id === id) : null;
      const note: Note = {
        id: id || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        createdAt: prev?.createdAt ?? timestamp,
        updatedAt: timestamp,
        images: entryImages,
      };
      await saveNote(note);
    }
    setLoading(false);
    router.back();
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title={type === "journal" ? "Journal entry" : "Note"}
        theme={theme}
        actions={[
          {
            icon: Save,
            label: "Save",
            onClick: () => void handleSave(),
            disabled: loading || !title.trim() || !content.trim(),
          },
        ]}
      />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="text-sm font-bold" style={{ color: theme.text }}>
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            placeholder={`${type} title`}
          />
        </div>
        <div>
          <p className="mb-1 text-sm font-bold" style={{ color: theme.text }}>
            Content
          </p>
          <EnhancedTextEditor
            value={content}
            onChange={setContent}
            placeholder={`Write your ${type}…`}
            onImageAdd={(uri) => setEntryImages((p) => [...p, uri])}
            maxLength={type === "note" ? 2000 : undefined}
            maxWords={type === "note" ? 300 : undefined}
            showCharCount
          />
        </div>
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border-2 py-3 font-semibold"
            style={{ borderColor: theme.border, color: theme.textSecondary }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !title.trim() || !content.trim()}
            onClick={() => void handleSave()}
            className="flex-1 rounded-lg py-3 font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: theme.primary }}
          >
            {id ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditorView() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <EditorInner />
    </Suspense>
  );
}
