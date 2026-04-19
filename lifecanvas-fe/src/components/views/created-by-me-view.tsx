"use client";

import Link from "next/link";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import {
  addFavorite,
  addMyQuote,
  deleteMyQuote,
  getAffirmations,
  getDefaultQuote,
  getMyQuotes,
  updateMyQuote,
} from "@/lib/storage";
import type { Affirmation, UserCreatedQuote } from "@/types";

export function CreatedByMeView() {
  const { theme } = useTheme();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [profileQuote, setProfileQuote] = useState<string | null>(null);
  const [myQuotes, setMyQuotes] = useState<UserCreatedQuote[]>([]);
  const [quoteDraft, setQuoteDraft] = useState("");
  const [authorDraft, setAuthorDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuote, setEditQuote] = useState("");
  const [editAuthor, setEditAuthor] = useState("");

  const load = () => {
    void (async () => {
      const [a, q, mq] = await Promise.all([
        getAffirmations(),
        getDefaultQuote(),
        getMyQuotes(),
      ]);
      setAffirmations(a);
      setProfileQuote(q);
      setMyQuotes(mq);
    })();
  };

  useEffect(() => {
    load();
  }, []);

  const addQuote = async () => {
    const q = quoteDraft.trim();
    if (!q) return;
    await addMyQuote(q, authorDraft);
    setQuoteDraft("");
    setAuthorDraft("");
    load();
  };

  const startEdit = (item: UserCreatedQuote) => {
    setEditingId(item.id);
    setEditQuote(item.quote);
    setEditAuthor(item.author);
  };

  const saveEdit = async () => {
    if (!editingId || !editQuote.trim()) return;
    await updateMyQuote(editingId, editQuote, editAuthor);
    setEditingId(null);
    setEditQuote("");
    setEditAuthor("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this quote?")) return;
    await deleteMyQuote(id);
    if (editingId === id) {
      setEditingId(null);
    }
    load();
  };

  const sendToFavorites = async (item: UserCreatedQuote) => {
    await addFavorite(
      JSON.stringify({ quote: item.quote, author: item.author, kind: "quote" }),
    );
    load();
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader title="Created by me" theme={theme} />
      <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-24">
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
              Affirmations
            </h2>
            <Link
              href="/affirmations"
              className="text-xs font-semibold underline-offset-2 hover:underline"
              style={{ color: theme.primary }}
            >
              Manage
            </Link>
          </div>
          <p className="mb-3 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            Phrases you&apos;ve written in My affirmations.
          </p>
          {affirmations.length === 0 ? (
            <div
              className="rounded-xl border-2 p-4 text-center text-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.textSecondary }}
            >
              No affirmations yet. Add your first in{" "}
              <Link href="/affirmations" className="font-semibold underline" style={{ color: theme.primary }}>
                My affirmations
              </Link>
              .
            </div>
          ) : (
            <ul className="space-y-2">
              {affirmations.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border-2 p-3"
                  style={{ borderColor: theme.border, backgroundColor: theme.card }}
                >
                  <p style={{ color: theme.text }}>{a.text}</p>
                  <p className="mt-1 text-xs" style={{ color: theme.textSecondary }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
            Quotes
          </h2>
          <p className="mb-3 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            Write your own quotes below. Each entry uses{" "}
            <span className="font-mono text-[11px]">[Quote]</span> and{" "}
            <span className="font-mono text-[11px]">[Author Name]</span>. Add to Favorites to use them as your
            profile quote on Me.
          </p>

          <div
            className="mb-4 rounded-xl border-2 p-4"
            style={{ borderColor: theme.border, backgroundColor: theme.card }}
          >
            <label
              className="block text-xs font-semibold tracking-wide"
              style={{ color: theme.primary }}
              htmlFor="my-quote-text"
            >
              [Quote]
            </label>
            <textarea
              id="my-quote-text"
              value={quoteDraft}
              onChange={(e) => setQuoteDraft(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border-2 px-3 py-2 text-sm"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
              }}
              placeholder="The quote text…"
            />
            <label
              className="mt-3 block text-xs font-semibold tracking-wide"
              style={{ color: theme.primary }}
              htmlFor="my-quote-author"
            >
              [Author Name]
            </label>
            <input
              id="my-quote-author"
              value={authorDraft}
              onChange={(e) => setAuthorDraft(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 px-3 py-2 text-sm"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.text,
              }}
              placeholder="Who said it?"
            />
            <button
              type="button"
              disabled={!quoteDraft.trim()}
              onClick={() => void addQuote()}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
            >
              Save quote
            </button>
          </div>

          {myQuotes.length === 0 ? (
            <div
              className="rounded-xl border-2 p-4 text-center text-sm"
              style={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.textSecondary }}
            >
              No saved quotes yet. Use the form above to create one.
            </div>
          ) : (
            <ul className="space-y-3">
              {myQuotes.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border-2 p-4"
                    style={{ borderColor: theme.border, backgroundColor: theme.card }}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold" style={{ color: theme.primary }}>
                          [Quote]
                        </label>
                        <textarea
                          value={editQuote}
                          onChange={(e) => setEditQuote(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border-2 px-2 py-1 text-sm"
                          style={{ borderColor: theme.border, color: theme.text }}
                        />
                        <label className="block text-xs font-semibold" style={{ color: theme.primary }}>
                          [Author Name]
                        </label>
                        <input
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                          className="w-full rounded-lg border-2 px-2 py-1 text-sm"
                          style={{ borderColor: theme.border, color: theme.text }}
                        />
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => void saveEdit()}
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
                            style={{ backgroundColor: theme.primary }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                            }}
                            className="rounded-lg border-2 px-3 py-1.5 text-sm"
                            style={{ borderColor: theme.border, color: theme.text }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: theme.primary }}>
                          [Quote]
                        </p>
                        <p className="italic" style={{ color: theme.text }}>
                          &ldquo;{item.quote}&rdquo;
                        </p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: theme.primary }}>
                          [Author Name]
                        </p>
                        <p className="text-sm" style={{ color: theme.textSecondary }}>
                          {item.author}
                        </p>
                        <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void sendToFavorites(item)}
                            className="rounded-lg p-2"
                            style={{ color: theme.primary }}
                            title="Add to Favorites"
                            aria-label="Add to Favorites"
                          >
                            <Heart className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="rounded-lg p-2"
                            style={{ color: theme.primary }}
                            aria-label="Edit"
                          >
                            <Pencil className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(item.id)}
                            className="rounded-lg p-2 text-red-500"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div
            className="mt-4 rounded-xl border-2 p-4"
            style={{ borderColor: theme.border, backgroundColor: theme.surface }}
          >
            <p
              className="mb-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: theme.primary }}
            >
              Profile quote (Me tab)
            </p>
            {profileQuote ? (
              <>
                <p className="italic text-sm" style={{ color: theme.text }}>
                  &ldquo;{profileQuote}&rdquo;
                </p>
                <Link
                  href="/favorites"
                  className="mt-2 inline-block text-xs font-semibold underline-offset-2 hover:underline"
                  style={{ color: theme.primary }}
                >
                  Change in Favorites (tap the pin) →
                </Link>
              </>
            ) : (
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                Heart a quote in{" "}
                <Link href="/favorites" className="font-semibold underline" style={{ color: theme.primary }}>
                  Favorites
                </Link>{" "}
                and tap the pin, or add one of your quotes here to Favorites first.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
