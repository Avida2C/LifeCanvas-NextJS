"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DestructiveConfirmDialog } from "@/components/destructive-confirm-dialog";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import {
  deleteAffirmation,
  getAffirmations,
  getDefaultAffirmation,
  saveAffirmation,
  setDefaultAffirmation,
  updateAffirmation,
} from "@/lib/storage";
import type { Affirmation } from "@/types";

/** CRUD view for user-created affirmations and default selection. */
export function AffirmationsView() {
  const { theme } = useTheme();
  const [items, setItems] = useState<Affirmation[]>([]);
  const [draft, setDraft] = useState("");
  const [def, setDef] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    text: string;
  } | null>(null);

  const reloadAffirmations = () => {
    void (async () => {
      const [data, d] = await Promise.all([
        getAffirmations(),
        getDefaultAffirmation(),
      ]);
      setItems(data);
      setDef(d);
    })();
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [data, d] = await Promise.all([
        getAffirmations(),
        getDefaultAffirmation(),
      ]);
      if (cancelled) return;
      setItems(data);
      setDef(d);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const add = async () => {
    if (!draft.trim()) return;
    await saveAffirmation(draft.trim());
    setDraft("");
    reloadAffirmations();
  };

  const confirmDeleteAffirmation = async () => {
    if (!pendingDelete) return;
    await deleteAffirmation(pendingDelete.id);
    setPendingDelete(null);
    reloadAffirmations();
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader title="My affirmations" theme={theme} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
        <div
          className="border-2 p-4"
          style={{ backgroundColor: theme.card, borderColor: theme.border }}
        >
          <p className="mb-2 font-bold" style={{ color: theme.text }}>
            New affirmation
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full rounded-lg border-2 px-3 py-2"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surface,
              color: theme.text,
            }}
            placeholder="I am capable…"
          />
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={() => void add()}
            className="mt-2 rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: theme.primary }}
          >
            Add
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-sm" style={{ color: theme.textSecondary }}>
            No affirmations yet.
          </p>
        ) : (
          items.map((a) => {
            const isDefault = def === a.text;
            const isEditing = editingId === a.id;
            return (
              <div
                key={a.id}
                className="border-l-4 border-2 p-4"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderLeftColor: isDefault ? "#FFD700" : theme.primary,
                }}
              >
                {isDefault && (
                  <span className="mb-2 inline-block rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">
                    PROFILE
                  </span>
                )}
                {isEditing ? (
                  <>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full rounded border-2 px-2 py-1"
                      style={{ borderColor: theme.border, color: theme.text }}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                        className="rounded border px-3 py-1 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editingId || !editText.trim()) return;
                          await updateAffirmation(editingId, editText.trim());
                          if (def === a.text) {
                            await setDefaultAffirmation(editText.trim());
                          }
                          setEditingId(null);
                          setEditText("");
                          reloadAffirmations();
                        }}
                        className="rounded px-3 py-1 text-sm text-white"
                        style={{ backgroundColor: theme.primary }}
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ color: theme.text }}>{a.text}</p>
                    <p className="text-xs italic" style={{ color: theme.textSecondary }}>
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (isDefault) await setDefaultAffirmation(null);
                          else await setDefaultAffirmation(a.text);
                          reloadAffirmations();
                        }}
                        style={{ color: isDefault ? "#FFD700" : theme.primary }}
                      >
                        <Star className={`size-5 ${isDefault ? "fill-yellow-400" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(a.id);
                          setEditText(a.text);
                        }}
                        style={{ color: theme.primary }}
                      >
                        <Pencil className="size-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete({ id: a.id, text: a.text })}
                        className="text-red-500"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <DestructiveConfirmDialog
        theme={theme}
        open={pendingDelete != null}
        titleId="confirm-delete-affirmation-title"
        title="Delete this affirmation?"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDeleteAffirmation()}
      >
        {pendingDelete ? (
          <p className="whitespace-pre-wrap break-words">
            {pendingDelete.text.length > 200
              ? `${pendingDelete.text.slice(0, 200)}…`
              : pendingDelete.text}
          </p>
        ) : null}
        <p className="mt-2">This cannot be undone.</p>
      </DestructiveConfirmDialog>
    </div>
  );
}
