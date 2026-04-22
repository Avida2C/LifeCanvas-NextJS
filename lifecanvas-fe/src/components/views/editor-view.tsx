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
  getPhotos,
  saveDataUrlToMediaGalleryAndGetId,
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

  // Editor image refs may be either legacy data URLs or gallery media ids.
  const isDataUrl = (v: string) => v.startsWith("data:image/") || v.startsWith("data:video/");

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
    if (entryImages.some((ref) => ref.startsWith("uploading:"))) {
      alert("Please wait for image uploads to finish.");
      return;
    }
    setLoading(true);
    const timestamp = new Date().toISOString();
    const allPhotos = await getPhotos();
    const knownIds = new Set(allPhotos.map((p) => p.id));
    // Reuse id for duplicate data URLs in a single save to avoid duplicate media rows.
    const cache = new Map<string, string>();
    const normalizedImages: string[] = [];
    for (const ref of entryImages) {
      if (!ref) continue;
      if (isDataUrl(ref)) {
        const cachedId = cache.get(ref);
        if (cachedId) {
          normalizedImages.push(cachedId);
          continue;
        }
        const savedId = await saveDataUrlToMediaGalleryAndGetId(ref, {
          name: type === "journal" ? "Journal image" : "Note image",
        });
        if (savedId) {
          cache.set(ref, savedId);
          normalizedImages.push(savedId);
          knownIds.add(savedId);
          continue;
        }
        // Keep legacy ref if save failed so content does not lose image.
        normalizedImages.push(ref);
        continue;
      }
      if (knownIds.has(ref)) {
        normalizedImages.push(ref);
      }
    }
    if (type === "journal") {
      const prev = id ? (await getJournalEntries()).find((e) => e.id === id) : null;
      const entry: JournalEntry = {
        id: id || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        createdAt: prev?.createdAt ?? timestamp,
        updatedAt: timestamp,
        images: normalizedImages,
        isPinned: prev?.isPinned,
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
        images: normalizedImages,
        isPinned: prev?.isPinned,
      };
      await saveNote(note);
    }
    setLoading(false);
    router.back();
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title={type === "journal" ? "Journal" : "Note"}
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
            onImageAdd={(uri) => {
              // Keep image slot ordering stable while async media save resolves.
              const tempRef = `uploading:${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
              setEntryImages((p) => [...p, tempRef]);
              void (async () => {
                const savedId = await saveDataUrlToMediaGalleryAndGetId(uri, {
                  name: type === "journal" ? "Journal image" : "Note image",
                });
                setEntryImages((prev) => {
                  const idx = prev.indexOf(tempRef);
                  if (idx < 0) return prev;
                  const next = [...prev];
                  next[idx] = savedId ?? uri;
                  return next;
                });
              })();
            }}
            nextImageIndex={entryImages.length}
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
