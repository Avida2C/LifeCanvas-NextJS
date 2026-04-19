"use client";

import { Heart, Pin } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import {
  getDefaultAffirmation,
  getDefaultQuote,
  getFavorites,
  removeFavorite,
  setDefaultAffirmation,
  setDefaultQuote,
} from "@/lib/storage";
import type { Quote } from "@/types";

function favoriteKind(q: Quote): "quote" | "affirmation" {
  return q.kind === "affirmation" ? "affirmation" : "quote";
}

export function FavoritesView() {
  const { theme } = useTheme();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [defaultQuote, setDefaultQuoteState] = useState<string | null>(null);
  const [defaultAffirmation, setDefaultAffirmationState] = useState<string | null>(null);

  const refetch = async () => {
    const [favoriteIds, defQ, defA] = await Promise.all([
      getFavorites(),
      getDefaultQuote(),
      getDefaultAffirmation(),
    ]);
    setDefaultQuoteState(defQ);
    setDefaultAffirmationState(defA);
    setQuotes(
      favoriteIds.map((id) => {
        try {
          return JSON.parse(id) as Quote;
        } catch {
          return { quote: id, author: "Unknown" };
        }
      }),
    );
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [favoriteIds, defQ, defA] = await Promise.all([
        getFavorites(),
        getDefaultQuote(),
        getDefaultAffirmation(),
      ]);
      if (cancelled) return;
      setDefaultQuoteState(defQ);
      setDefaultAffirmationState(defA);
      setQuotes(
        favoriteIds.map((id) => {
          try {
            return JSON.parse(id) as Quote;
          } catch {
            return { quote: id, author: "Unknown" };
          }
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = async (quoteText: string) => {
    const all = await getFavorites();
    const toRemove = all.find((item) => {
      try {
        return (JSON.parse(item) as Quote).quote === quoteText;
      } catch {
        return item === quoteText;
      }
    });
    const [dq, da] = await Promise.all([getDefaultQuote(), getDefaultAffirmation()]);
    if (toRemove) await removeFavorite(toRemove);
    if (dq === quoteText) await setDefaultQuote(null);
    if (da === quoteText) await setDefaultAffirmation(null);
    await refetch();
  };

  const isOnProfile = (q: Quote) => {
    const k = favoriteKind(q);
    if (k === "affirmation") return defaultAffirmation === q.quote;
    return defaultQuote === q.quote;
  };

  const toggleProfile = async (q: Quote) => {
    const k = favoriteKind(q);
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
    await refetch();
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader title="Favorites" theme={theme} />
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
        <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
          One item can appear on your Me tab at a time. Tap the pin: quotes (from Inspire → Quotes) show with an
          author; affirmations (from Inspire → Affirmations) show as an affirmation only.
        </p>
        {quotes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-5xl">❤️</p>
            <p className="mt-2 font-bold">No favorites yet</p>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Heart quotes and affirmations in Inspire to save them here.
            </p>
          </div>
        ) : (
          quotes.map((quote, index) => {
            const k = favoriteKind(quote);
            const profile = isOnProfile(quote);
            return (
              <div
                key={index}
                className="border-b-2 p-4"
                style={{
                  backgroundColor: theme.card,
                  borderColor: profile ? "#FFD700" : theme.border,
                }}
              >
                {profile && (
                  <span className="mb-2 inline-block rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-bold text-black">
                    ON PROFILE · {k === "affirmation" ? "Affirmation" : "Quote"}
                  </span>
                )}
                <p className="italic" style={{ color: theme.text }}>
                  &ldquo;{quote.quote}&rdquo;
                </p>
                {k === "quote" ? (
                  <p className="mt-2 text-right text-sm" style={{ color: theme.textSecondary }}>
                    — {quote.author}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleProfile(quote)}
                    className="rounded-lg p-2"
                    style={{ color: profile ? "#FFD700" : theme.primary }}
                    aria-label={profile ? "Remove from profile" : "Show on Me profile"}
                    title="Show on Me tab"
                  >
                    <Pin className={`size-6 ${profile ? "fill-yellow-400" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(quote.quote)}
                    className="rounded-lg p-2 text-red-500"
                    aria-label="Remove"
                  >
                    <Heart className="size-6 fill-current" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
