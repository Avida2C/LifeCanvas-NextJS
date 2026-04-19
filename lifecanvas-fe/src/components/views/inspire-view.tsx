"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { fetchAffirmations, fetchQuotes } from "@/lib/api";
import { addFavorite, getFavorites, removeFavorite } from "@/lib/storage";
import type { Quote } from "@/types";

/** Last successful Inspire feed; avoids empty state while refetching after navigation. */
let inspireFeedCache: { quotes: Quote[]; affirmations: Quote[] } | null = null;

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
  const [tab, setTab] = useState<"affirmations" | "quotes">("affirmations");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [affirmations, setAffirmations] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

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
      const favTexts = await favoriteTexts();
      setQuotes(applyFavoriteFlags(inspireFeedCache.quotes, favTexts));
      setAffirmations(applyFavoriteFlags(inspireFeedCache.affirmations, favTexts));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [q, a, favTexts] = await Promise.all([
        fetchQuotes(),
        fetchAffirmations(),
        favoriteTexts(),
      ]);
      q.forEach((x) => {
        x.exists = favTexts.includes(x.quote);
      });
      a.forEach((x) => {
        x.exists = favTexts.includes(x.quote);
      });
      setQuotes(q);
      setAffirmations(a);
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
          <p className="text-5xl">{isAffirmation ? "✨" : "💭"}</p>
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
      <div className="space-y-3 p-3 pb-24">
        {list.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 border-b-2 p-3"
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
        <div className="flex overflow-hidden rounded-lg border-2" style={{ borderColor: theme.border }}>
          <button
            type="button"
            className="flex-1 py-2 text-sm font-semibold"
            style={{
              backgroundColor: tab === "affirmations" ? theme.primary : theme.surface,
              color: tab === "affirmations" ? "#fff" : theme.text,
            }}
            onClick={() => setTab("affirmations")}
          >
            Affirmations
          </button>
          <button
            type="button"
            className="flex-1 py-2 text-sm font-semibold"
            style={{
              backgroundColor: tab === "quotes" ? theme.primary : theme.surface,
              color: tab === "quotes" ? "#fff" : theme.text,
            }}
            onClick={() => setTab("quotes")}
          >
            Quotes
          </button>
        </div>
      </div>
      {tab === "affirmations" ? renderList(affirmations, true) : renderList(quotes, false)}
    </div>
  );
}
