"use client";

import {
  Heart,
  Pencil,
  Pin,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import {
  addFavorite,
  deleteAffirmation,
  deleteMyQuote,
  getAffirmations,
  getDefaultAffirmation,
  getDefaultQuote,
  getFavorites,
  getMyQuotes,
  removeFavorite,
  setDefaultAffirmation,
  setDefaultQuote,
  updateAffirmation,
  updateMyQuote,
} from "@/lib/storage";
import type { Affirmation, Quote, UserCreatedQuote } from "@/types";

async function findFavoriteStorageKey(quoteText: string): Promise<string | null> {
  const all = await getFavorites();
  for (const item of all) {
    try {
      if ((JSON.parse(item) as Quote).quote === quoteText) return item;
    } catch {
      if (item === quoteText) return item;
    }
  }
  return null;
}

async function removeFromFavoritesByText(quoteText: string) {
  const toRemove = await findFavoriteStorageKey(quoteText);
  if (!toRemove) return;
  const [dq, da] = await Promise.all([getDefaultQuote(), getDefaultAffirmation()]);
  await removeFavorite(toRemove);
  if (dq === quoteText) await setDefaultQuote(null);
  if (da === quoteText) await setDefaultAffirmation(null);
}

function toQuoteFromAffirmation(a: Affirmation): Quote {
  return { quote: a.text, author: "Yours", kind: "affirmation" };
}

function toQuoteFromMyQuote(q: UserCreatedQuote): Quote {
  return { quote: q.quote, author: q.author, kind: "quote" };
}

type Row =
  | { kind: "affirmation"; item: Affirmation }
  | { kind: "quote"; item: UserCreatedQuote };

type PendingDelete =
  | { kind: "affirmation"; item: Affirmation }
  | { kind: "quote"; item: UserCreatedQuote };

export function CreatedByMeView() {
  const { theme } = useTheme();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [defaultAffirmation, setDefaultAffirmationState] = useState<string | null>(null);
  const [profileQuote, setProfileQuote] = useState<string | null>(null);
  const [myQuotes, setMyQuotes] = useState<UserCreatedQuote[]>([]);
  const [favoriteTexts, setFavoriteTexts] = useState<Set<string>>(new Set());

  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editQuote, setEditQuote] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editingAffirmationId, setEditingAffirmationId] = useState<string | null>(null);
  const [editAffirmationText, setEditAffirmationText] = useState("");
  const [pendingUnheart, setPendingUnheart] = useState<Quote | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const refreshFavoriteSet = useCallback(async () => {
    const raw = await getFavorites();
    const texts = new Set<string>();
    for (const item of raw) {
      try {
        texts.add((JSON.parse(item) as Quote).quote);
      } catch {
        texts.add(item);
      }
    }
    setFavoriteTexts(texts);
  }, []);

  const load = useCallback(() => {
    void (async () => {
      const [a, defQ, defA, mq] = await Promise.all([
        getAffirmations(),
        getDefaultQuote(),
        getDefaultAffirmation(),
        getMyQuotes(),
      ]);
      setAffirmations(a);
      setProfileQuote(defQ);
      setDefaultAffirmationState(defA);
      setMyQuotes(mq);
      await refreshFavoriteSet();
    })();
  }, [refreshFavoriteSet]);

  useEffect(() => {
    load();
  }, [load]);

  const anyModalOpen = Boolean(pendingUnheart || pendingDelete);
  useEffect(() => {
    if (!anyModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [anyModalOpen]);

  useEffect(() => {
    if (!anyModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPendingUnheart(null);
        setPendingDelete(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyModalOpen]);

  const rows: Row[] = [
    ...affirmations.map((item) => ({ kind: "affirmation" as const, item })),
    ...myQuotes.map((item) => ({ kind: "quote" as const, item })),
  ].sort(
    (a, b) =>
      new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime(),
  );

  const isFavorite = (quoteText: string) => favoriteTexts.has(quoteText);

  const isOnProfile = (q: Quote) => {
    const k = q.kind === "affirmation" ? "affirmation" : "quote";
    if (k === "affirmation") return defaultAffirmation === q.quote;
    return profileQuote === q.quote;
  };

  const toggleProfile = async (q: Quote) => {
    const k = q.kind === "affirmation" ? "affirmation" : "quote";
    const on = isOnProfile(q);
    if (on) {
      if (k === "affirmation") await setDefaultAffirmation(null);
      else await setDefaultQuote(null);
    } else {
      if (k === "affirmation") {
        await setDefaultAffirmation(q.quote);
        await setDefaultQuote(null);
      } else {
        await setDefaultQuote(q.quote);
        await setDefaultAffirmation(null);
      }
    }
    load();
  };

  const removeFromFavoritesOnly = async (quoteText: string) => {
    const toRemove = await findFavoriteStorageKey(quoteText);
    if (!toRemove) return;
    const [dq, da] = await Promise.all([getDefaultQuote(), getDefaultAffirmation()]);
    await removeFavorite(toRemove);
    if (dq === quoteText) await setDefaultQuote(null);
    if (da === quoteText) await setDefaultAffirmation(null);
    load();
  };

  const requestFavoriteToggle = (q: Quote) => {
    const fav = isFavorite(q.quote);
    if (fav && isOnProfile(q)) {
      setPendingUnheart(q);
      return;
    }
    void (async () => {
      if (fav) {
        await removeFromFavoritesOnly(q.quote);
      } else {
        await addFavorite(JSON.stringify(q));
      }
      load();
    })();
  };

  const confirmUnheart = async () => {
    if (!pendingUnheart) return;
    await removeFromFavoritesOnly(pendingUnheart.quote);
    setPendingUnheart(null);
  };

  const startEditQuote = (item: UserCreatedQuote) => {
    setEditingQuoteId(item.id);
    setEditQuote(item.quote);
    setEditAuthor(item.author);
  };

  const saveEditQuote = async () => {
    if (!editingQuoteId || !editQuote.trim()) return;
    const prev = myQuotes.find((q) => q.id === editingQuoteId);
    await updateMyQuote(editingQuoteId, editQuote, editAuthor);
    if (prev && profileQuote === prev.quote) {
      await setDefaultQuote(editQuote.trim());
    }
    if (prev) {
      const favKey = await findFavoriteStorageKey(prev.quote);
      if (favKey) {
        await removeFavorite(favKey);
        await addFavorite(
          JSON.stringify({
            quote: editQuote.trim(),
            author: editAuthor.trim() || "Unknown",
            kind: "quote" as const,
          }),
        );
      }
    }
    setEditingQuoteId(null);
    setEditQuote("");
    setEditAuthor("");
    load();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "affirmation") {
      const a = pendingDelete.item;
      await deleteAffirmation(a.id);
      if (defaultAffirmation === a.text) await setDefaultAffirmation(null);
      const favKey = await findFavoriteStorageKey(a.text);
      if (favKey) await removeFromFavoritesByText(a.text);
      if (editingAffirmationId === a.id) setEditingAffirmationId(null);
    } else {
      const item = pendingDelete.item;
      await deleteMyQuote(item.id);
      if (profileQuote === item.quote) await setDefaultQuote(null);
      const favKey = await findFavoriteStorageKey(item.quote);
      if (favKey) await removeFromFavoritesByText(item.quote);
      if (editingQuoteId === item.id) setEditingQuoteId(null);
    }
    setPendingDelete(null);
    load();
  };

  const startEditAffirmation = (a: Affirmation) => {
    setEditingAffirmationId(a.id);
    setEditAffirmationText(a.text);
  };

  const saveEditAffirmation = async () => {
    if (!editingAffirmationId || !editAffirmationText.trim()) return;
    const prev = affirmations.find((x) => x.id === editingAffirmationId);
    await updateAffirmation(editingAffirmationId, editAffirmationText.trim());
    if (prev && defaultAffirmation === prev.text) {
      await setDefaultAffirmation(editAffirmationText.trim());
    }
    const favKey = prev ? await findFavoriteStorageKey(prev.text) : null;
    if (favKey && prev) {
      await removeFavorite(favKey);
      await addFavorite(
        JSON.stringify({
          quote: editAffirmationText.trim(),
          author: "Yours",
          kind: "affirmation" as const,
        }),
      );
    }
    setEditingAffirmationId(null);
    setEditAffirmationText("");
    load();
  };

  const totalCount = affirmations.length + myQuotes.length;

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader title="Created by me" theme={theme} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
        {totalCount === 0 ? (
          <div className="py-16 text-center">
            <div className="flex justify-center" aria-hidden>
              <Sparkles
                className="size-16"
                strokeWidth={1.25}
                style={{ color: theme.textSecondary }}
              />
            </div>
            <p className="mt-2 font-bold" style={{ color: theme.text }}>
              Nothing here yet
            </p>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Add affirmations or quotes from Inspire (FAB).
            </p>
          </div>
        ) : (
          rows.map((row) => {
            if (row.kind === "affirmation") {
              const a = row.item;
              const q = toQuoteFromAffirmation(a);
              const profile = isOnProfile(q);
              const fav = isFavorite(a.text);
              const isEditing = editingAffirmationId === a.id;
              return (
                <div
                  key={`a-${a.id}`}
                  className="border-b-2 p-4"
                  style={{
                    backgroundColor: theme.card,
                    borderColor: profile ? "#FFD700" : theme.border,
                  }}
                >
                  {profile && (
                    <span className="mb-2 inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-bold text-black">
                      ON PROFILE · Affirmation
                    </span>
                  )}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editAffirmationText}
                        onChange={(e) => setEditAffirmationText(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border-2 px-3 py-2 text-sm"
                        style={{
                          borderColor: theme.border,
                          color: theme.text,
                          backgroundColor: theme.surface,
                        }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void saveEditAffirmation()}
                          disabled={!editAffirmationText.trim()}
                          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          style={{ backgroundColor: theme.primary }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAffirmationId(null);
                            setEditAffirmationText("");
                          }}
                          className="rounded-lg border-2 px-4 py-2 text-sm"
                          style={{ borderColor: theme.border, color: theme.text }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="italic" style={{ color: theme.text }}>
                        &ldquo;{a.text}&rdquo;
                      </p>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleProfile(q)}
                          className="rounded-lg p-2"
                          style={{ color: profile ? "#FFD700" : theme.primary }}
                          aria-label={profile ? "Remove from profile" : "Show on Me profile"}
                          title="Show on Me tab"
                        >
                          <Pin className={`size-6 ${profile ? "fill-yellow-400" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestFavoriteToggle(q)}
                          className="rounded-lg p-2"
                          style={{ color: fav ? "#ef4444" : theme.primary }}
                          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart className={`size-6 ${fav ? "fill-current" : ""}`} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditAffirmation(a)}
                          className="rounded-lg p-2"
                          style={{ color: theme.primary }}
                          aria-label="Edit"
                        >
                          <Pencil className="size-6" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ kind: "affirmation", item: a })}
                          className="rounded-lg p-2 text-red-500"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-6" strokeWidth={2} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            }

            const item = row.item;
            const q = toQuoteFromMyQuote(item);
            const profile = isOnProfile(q);
            const fav = isFavorite(item.quote);
            const isEditing = editingQuoteId === item.id;
            return (
              <div
                key={`q-${item.id}`}
                className="border-b-2 p-4"
                style={{
                  backgroundColor: theme.card,
                  borderColor: profile ? "#FFD700" : theme.border,
                }}
              >
                {profile && (
                  <span className="mb-2 inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-bold text-black">
                    ON PROFILE · Quote
                  </span>
                )}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editQuote}
                      onChange={(e) => setEditQuote(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border-2 px-3 py-2 text-sm"
                      style={{
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.surface,
                      }}
                    />
                    <input
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      className="w-full rounded-lg border-2 px-3 py-2 text-sm"
                      style={{
                        borderColor: theme.border,
                        color: theme.text,
                        backgroundColor: theme.surface,
                      }}
                      placeholder="Author"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEditQuote()}
                        disabled={!editQuote.trim()}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: theme.primary }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingQuoteId(null)}
                        className="rounded-lg border-2 px-4 py-2 text-sm"
                        style={{ borderColor: theme.border, color: theme.text }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="italic" style={{ color: theme.text }}>
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <p className="mt-2 text-right text-sm" style={{ color: theme.textSecondary }}>
                      — {item.author}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleProfile(q)}
                        className="rounded-lg p-2"
                        style={{ color: profile ? "#FFD700" : theme.primary }}
                        aria-label={profile ? "Remove from profile" : "Show on Me profile"}
                        title="Show on Me tab"
                      >
                        <Pin className={`size-6 ${profile ? "fill-yellow-400" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestFavoriteToggle(q)}
                        className="rounded-lg p-2"
                        style={{ color: fav ? "#ef4444" : theme.primary }}
                        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className={`size-6 ${fav ? "fill-current" : ""}`} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditQuote(item)}
                        className="rounded-lg p-2"
                        style={{ color: theme.primary }}
                        aria-label="Edit"
                      >
                        <Pencil className="size-6" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete({ kind: "quote", item })}
                        className="rounded-lg p-2 text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-6" strokeWidth={2} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {pendingUnheart ? (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setPendingUnheart(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cbm-unheart-title"
            className="w-full max-w-md rounded-t-2xl border-2 shadow-2xl sm:rounded-2xl"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between gap-2 border-b-2 px-4 py-3"
              style={{ borderColor: theme.border }}
            >
              <h2 id="cbm-unheart-title" className="text-lg font-bold">
                Remove from favorites?
              </h2>
              <button
                type="button"
                onClick={() => setPendingUnheart(null)}
                className="rounded-lg p-2 hover:opacity-80"
                style={{ color: theme.textSecondary }}
                aria-label="Close"
              >
                <X className="size-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                This item is set on your Me profile. Removing it from favorites will take it off your profile as well.
              </p>
              <p className="mt-3 line-clamp-4 text-sm italic" style={{ color: theme.text }}>
                &ldquo;{pendingUnheart.quote}&rdquo;
              </p>
            </div>
            <div
              className="flex gap-2 border-t-2 px-4 py-3"
              style={{ borderColor: theme.border }}
            >
              <button
                type="button"
                onClick={() => setPendingUnheart(null)}
                className="min-h-11 flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmUnheart()}
                className="min-h-11 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: theme.error }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cbm-delete-title"
            className="w-full max-w-md rounded-t-2xl border-2 shadow-2xl sm:rounded-2xl"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between gap-2 border-b-2 px-4 py-3"
              style={{ borderColor: theme.border }}
            >
              <h2 id="cbm-delete-title" className="text-lg font-bold">
                {pendingDelete.kind === "affirmation" ? "Delete affirmation?" : "Delete quote?"}
              </h2>
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-lg p-2 hover:opacity-80"
                style={{ color: theme.textSecondary }}
                aria-label="Close"
              >
                <X className="size-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
                This can&apos;t be undone. It will be removed from here, Favorites, and Inspire if it appeared there.
              </p>
              <p className="mt-3 line-clamp-5 text-sm italic" style={{ color: theme.text }}>
                &ldquo;
                {pendingDelete.kind === "affirmation"
                  ? pendingDelete.item.text
                  : pendingDelete.item.quote}
                &rdquo;
              </p>
              {pendingDelete.kind === "quote" ? (
                <p className="mt-2 text-right text-sm" style={{ color: theme.textSecondary }}>
                  — {pendingDelete.item.author}
                </p>
              ) : null}
            </div>
            <div
              className="flex gap-2 border-t-2 px-4 py-3"
              style={{ borderColor: theme.border }}
            >
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="min-h-11 flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="min-h-11 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: theme.error }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
