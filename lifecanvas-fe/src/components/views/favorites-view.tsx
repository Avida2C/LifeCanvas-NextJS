"use client";

import { Heart, Pin, X } from "lucide-react";
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
  const [pendingUnheart, setPendingUnheart] = useState<Quote | null>(null);

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

  useEffect(() => {
    if (!pendingUnheart) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pendingUnheart]);

  useEffect(() => {
    if (!pendingUnheart) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingUnheart(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingUnheart]);

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

  const requestRemove = (q: Quote) => {
    if (isOnProfile(q)) {
      setPendingUnheart(q);
      return;
    }
    void remove(q.quote);
  };

  const confirmRemoveFromFavorites = async () => {
    if (!pendingUnheart) return;
    await remove(pendingUnheart.quote);
    setPendingUnheart(null);
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
        {quotes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="flex justify-center" aria-hidden>
              <Heart
                className="size-16"
                strokeWidth={1.25}
                style={{ color: theme.textSecondary }}
              />
            </div>
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
                    onClick={() => requestRemove(quote)}
                    className="rounded-lg p-2 text-red-500"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="size-6 fill-current" />
                  </button>
                </div>
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
            aria-labelledby="unheart-profile-title"
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
              <h2 id="unheart-profile-title" className="text-lg font-bold">
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
                This favorite is set on your Me profile. Removing it will take it off your profile as well.
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
                onClick={() => void confirmRemoveFromFavorites()}
                className="min-h-11 flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: theme.error }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
