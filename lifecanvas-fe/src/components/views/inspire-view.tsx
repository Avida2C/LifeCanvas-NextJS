"use client";

import { Heart, MessageCircle, Sparkles, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { fetchAffirmations, fetchQuotes } from "@/lib/api";
import {
  addFavorite,
  addMyQuote,
  getAffirmations,
  getFavorites,
  getMyQuotes,
  removeFavorite,
  saveAffirmation,
} from "@/lib/storage";
import type { Affirmation, Quote, UserCreatedQuote } from "@/types";

/** Last successful Inspire feed (API-only); user-created lines are merged on read. */
let inspireFeedCache: { quotes: Quote[]; affirmations: Quote[] } | null = null;

function shuffleInspire<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const dedupeQuotesByText = (quotes: Quote[]): Quote[] => {
  const seen = new Set<string>();
  return quotes.filter((q) => {
    const key = q.quote.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function mergeAffirmationFeed(fromApi: Quote[], stored: Affirmation[]): Quote[] {
  const mine: Quote[] = stored.map((x) => ({
    quote: x.text,
    author: "Yours",
  }));
  return shuffleInspire(dedupeQuotesByText([...mine, ...fromApi]));
}

function mergeQuoteFeed(fromApi: Quote[], stored: UserCreatedQuote[]): Quote[] {
  const mine: Quote[] = stored.map((m) => ({
    quote: m.quote,
    author: m.author?.trim() || "Unknown",
  }));
  return shuffleInspire(dedupeQuotesByText([...mine, ...fromApi]));
}

function applyFavoriteFlags(items: Quote[], favTexts: string[]): Quote[] {
  return items.map((x) => ({
    ...x,
    exists: favTexts.includes(x.quote),
  }));
}

function quotesForCache(items: Quote[]): Quote[] {
  return items.map((x) => {
    const { exists: _e, ...rest } = x;
    return rest;
  });
}

export function InspireView() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"affirmations" | "quotes">("affirmations");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [affirmations, setAffirmations] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createTab, setCreateTab] = useState<"affirmation" | "quote">("affirmation");
  const [affirmationDraft, setAffirmationDraft] = useState("");
  const [quoteDraft, setQuoteDraft] = useState("");
  const [authorDraft, setAuthorDraft] = useState("");
  const INSPIRE_TABS = [
    { id: "affirmations", label: "Affirmations" },
    { id: "quotes", label: "Quotes" },
  ] as const;
  const CREATE_TABS = [
    { id: "affirmation", label: "Affirmation" },
    { id: "quote", label: "Quote" },
  ] as const;

  const favoriteTexts = useCallback(async () => {
    const data = await getFavorites();
    return data.map((item) => {
      try {
        return (JSON.parse(item) as Quote).quote;
      } catch {
        return item;
      }
    });
  }, []);

  const loadData = useCallback(async (opts?: { skipCache?: boolean }) => {
    const skipCache = opts?.skipCache ?? false;

    if (!skipCache && inspireFeedCache) {
      const [favTexts, userAffs, userMq] = await Promise.all([
        favoriteTexts(),
        getAffirmations(),
        getMyQuotes(),
      ]);
      const mergedQ = mergeQuoteFeed(inspireFeedCache.quotes, userMq);
      const mergedA = mergeAffirmationFeed(
        inspireFeedCache.affirmations,
        userAffs,
      );
      setQuotes(applyFavoriteFlags(mergedQ, favTexts));
      setAffirmations(applyFavoriteFlags(mergedA, favTexts));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [q, a, favTexts, userAffs, userMq] = await Promise.all([
        fetchQuotes(),
        fetchAffirmations(),
        favoriteTexts(),
        getAffirmations(),
        getMyQuotes(),
      ]);
      const mergedQuotes = mergeQuoteFeed(q, userMq);
      const mergedAffs = mergeAffirmationFeed(a, userAffs);
      mergedQuotes.forEach((x) => {
        x.exists = favTexts.includes(x.quote);
      });
      mergedAffs.forEach((x) => {
        x.exists = favTexts.includes(x.quote);
      });
      setQuotes(mergedQuotes);
      setAffirmations(mergedAffs);
      inspireFeedCache = {
        quotes: quotesForCache(q),
        affirmations: quotesForCache(a),
      };
    } finally {
      setLoading(false);
    }
  }, [favoriteTexts]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!createOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [createOpen]);

  useEffect(() => {
    if (!createOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreateOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createOpen]);

  const resetCreateForm = useCallback(() => {
    setAffirmationDraft("");
    setQuoteDraft("");
    setAuthorDraft("");
  }, []);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;
    setCreateTab(
      searchParams.get("kind") === "quote" ? "quote" : "affirmation",
    );
    resetCreateForm();
    setCreateOpen(true);
    router.replace("/inspire", { scroll: false });
  }, [searchParams, router, resetCreateForm]);

  const closeCreateModal = () => {
    setCreateOpen(false);
    resetCreateForm();
  };

  const submitAffirmation = async () => {
    const text = affirmationDraft.trim();
    if (!text) return;
    await saveAffirmation(text);
    closeCreateModal();
    void loadData({ skipCache: true });
  };

  const submitQuote = async () => {
    const q = quoteDraft.trim();
    if (!q) return;
    await addMyQuote(q, authorDraft);
    closeCreateModal();
    void loadData({ skipCache: true });
  };

  const toggleFavorite = async (quoteText: string, isAffirmation: boolean) => {
    const list = isAffirmation ? affirmations : quotes;
    const quote = list.find((x) => x.quote === quoteText);
    if (!quote) return;
    if (quote.exists) {
      const all = await getFavorites();
      const toRemove = all.find((item) => {
        try {
          return (JSON.parse(item) as Quote).quote === quoteText;
        } catch {
          return item === quoteText;
        }
      });
      if (toRemove) await removeFavorite(toRemove);
      quote.exists = false;
    } else {
      await addFavorite(
        JSON.stringify({
          quote: quote.quote,
          author: quote.author,
          kind: isAffirmation ? "affirmation" : "quote",
        }),
      );
      quote.exists = true;
    }
    await loadData({ skipCache: true });
  };

  const renderList = (items: Quote[], isAffirmation: boolean) => {
    const list = items.filter((x) => !x.exists);
    if (loading && list.length === 0) {
      return (
        <p className="p-8 text-center" style={{ color: theme.textSecondary }}>
          Loading…
        </p>
      );
    }
    if (list.length === 0) {
      return (
        <div className="py-16 text-center px-6">
          <div className="flex justify-center" aria-hidden>
            {isAffirmation ? (
              <Sparkles
                className="size-16"
                strokeWidth={1.25}
                style={{ color: theme.textSecondary }}
              />
            ) : (
              <MessageCircle
                className="size-16"
                strokeWidth={1.25}
                style={{ color: theme.textSecondary }}
              />
            )}
          </div>
          <p className="mt-2 font-bold" style={{ color: theme.text }}>
            {items.some((x) => x.exists) ? "You favorited them all!" : "Pull refresh"}
          </p>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Open the browser refresh or revisit to load new quotes.
          </p>
          <button
            type="button"
            onClick={() => void loadData({ skipCache: true })}
            className="mt-4 rounded-lg px-4 py-2 text-white"
            style={{ backgroundColor: theme.primary }}
          >
            Refresh
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-3 p-4 pb-24">
        {list.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-2xl border-2 p-4"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            <div className="min-w-0 flex-1">
              <p style={{ color: theme.text }}>{item.quote}</p>
              {!isAffirmation && (
                <p className="mt-1 text-right text-sm" style={{ color: theme.textSecondary }}>
                  — {item.author}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void toggleFavorite(item.quote, isAffirmation)}
              className="shrink-0 p-2"
              style={{ color: theme.primary }}
              aria-label="Favorite"
            >
              <Heart className="size-8" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <div className="px-4 py-2" style={{ backgroundColor: theme.surface }}>
        <SegmentedTabs
          tabs={INSPIRE_TABS}
          value={tab}
          onChange={setTab}
          theme={theme}
        />
      </div>
      {tab === "affirmations" ? renderList(affirmations, true) : renderList(quotes, false)}

      {createOpen && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={closeCreateModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspire-create-title"
            className="flex max-h-[min(90dvh,640px)] w-full max-w-md flex-col rounded-t-2xl border-2 shadow-2xl sm:rounded-2xl"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex shrink-0 items-center justify-between gap-2 border-b-2 px-4 py-3"
              style={{ borderColor: theme.border }}
            >
              <h2 id="inspire-create-title" className="text-lg font-bold">
                Create new
              </h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 hover:opacity-80"
                style={{ color: theme.textSecondary }}
                aria-label="Close"
              >
                <X className="size-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="shrink-0 px-4 pt-3">
              <SegmentedTabs
                tabs={CREATE_TABS}
                value={createTab}
                onChange={setCreateTab}
                theme={theme}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {createTab === "affirmation" ? (
                <div className="space-y-3">
                  <textarea
                    value={affirmationDraft}
                    onChange={(e) => setAffirmationDraft(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border-2 px-3 py-2"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      color: theme.text,
                    }}
                    placeholder="I am capable…"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={!affirmationDraft.trim()}
                    onClick={() => void submitAffirmation()}
                    className="w-full rounded-lg px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Add affirmation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label
                      className="block text-xs font-semibold tracking-wide"
                      style={{ color: theme.primary }}
                      htmlFor="inspire-quote-text"
                    >
                      Quote
                    </label>
                    <textarea
                      id="inspire-quote-text"
                      value={quoteDraft}
                      onChange={(e) => setQuoteDraft(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border-2 px-3 py-2 text-sm"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                        color: theme.text,
                      }}
                      placeholder="The quote text…"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold tracking-wide"
                      style={{ color: theme.primary }}
                      htmlFor="inspire-quote-author"
                    >
                      Author
                    </label>
                    <input
                      id="inspire-quote-author"
                      value={authorDraft}
                      onChange={(e) => setAuthorDraft(e.target.value)}
                      className="mt-1 w-full rounded-lg border-2 px-3 py-2 text-sm"
                      style={{
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                        color: theme.text,
                      }}
                      placeholder="Who said it?"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!quoteDraft.trim()}
                    onClick={() => void submitQuote()}
                    className="w-full rounded-lg px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Save quote
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
