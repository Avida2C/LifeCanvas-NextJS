"use client";

import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { fetchAffirmations, fetchQuotes } from "@/lib/api";
import {
  addFavorite,
  getAffirmations,
  getFavorites,
  getMyQuotes,
  removeFavorite,
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
  // User-authored affirmations are blended into the same feed as API data.
  const mine: Quote[] = stored.map((x) => ({
    quote: x.text,
    author: "Yours",
  }));
  return shuffleInspire(dedupeQuotesByText([...mine, ...fromApi]));
}

function mergeQuoteFeed(fromApi: Quote[], stored: UserCreatedQuote[]): Quote[] {
  // "Created by me" quotes are shown inline with fetched quotes.
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
  return items.map(({ exists: _exists, ...rest }) => rest);
}

export function InspireView() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"affirmations" | "quotes">("affirmations");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [affirmations, setAffirmations] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const INSPIRE_TABS = [
    { id: "affirmations", label: "Affirmations" },
    { id: "quotes", label: "Quotes" },
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
      // Render quickly from cache, then refresh from network in the background.
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
    if (searchParams.get("create") !== "1") return;
    const kind = searchParams.get("kind");
    const next = kind === "quote" ? "/inspire-editor?kind=quote" : "/inspire-editor";
    router.replace(next, { scroll: false });
  }, [searchParams, router]);

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
    // Reload to keep favorites + feed ordering consistent after mutation.
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
    </div>
  );
}
