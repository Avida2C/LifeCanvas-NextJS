"use client";

import {
  Heart,
  ListTodo,
  PenLine,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import {
  getAffirmations,
  getFavorites,
  getMyQuotes,
  getTaskLists,
} from "@/lib/storage";
import type {
  Affirmation,
  Quote,
  TaskList,
  UserCreatedQuote,
} from "@/types";

/** Phrases users might type when searching by calendar date. */
function dateSearchVariants(iso: string | undefined): string[] {
  if (!iso) return [];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return [];
  const variants = new Set<string>();
  variants.add(iso);
  if (iso.length >= 10) variants.add(iso.slice(0, 10));
  variants.add(
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  );
  variants.add(
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  );
  variants.add(String(d.getFullYear()));
  variants.add(d.toLocaleDateString(undefined, { month: "long" }));
  variants.add(d.toLocaleDateString(undefined, { month: "short" }));
  variants.add(
    `${d.getDate()}`.padStart(2, "0"),
  );
  return [...variants];
}

/**
 * Each whitespace-separated term must appear somewhere in the combined fields
 * (supports longer queries like author + year).
 */
function matchesQuery(q: string, ...parts: (string | undefined)[]) {
  const query = q.trim().toLowerCase();
  if (!query) return false;
  const words = query.split(/\s+/).filter(Boolean);
  const haystack = parts
    .flatMap((p) => {
      const s = (p ?? "").trim();
      return s ? [s.toLowerCase()] : [];
    })
    .join(" ");
  if (words.length === 0) return false;
  return words.every((w) => haystack.includes(w));
}

function parseFavorite(raw: string): Quote {
  try {
    return JSON.parse(raw) as Quote;
  } catch {
    return { quote: raw, author: "Unknown" };
  }
}

/** Cross-library search overlay spanning favorites, tasks, and authored content. */
export function SearchView({
  onDismiss,
  onNavigate,
}: {
  onDismiss?: () => void;
  /** Called after tapping a result (closes host sheet). */
  onNavigate?: () => void;
}) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [myQuotes, setMyQuotes] = useState<UserCreatedQuote[]>([]);
  const [favoriteRows, setFavoriteRows] = useState<Quote[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [t, aff, mq, favIds] = await Promise.all([
        getTaskLists(),
        getAffirmations(),
        getMyQuotes(),
        getFavorites(),
      ]);
      if (cancelled) return;
      setTaskLists(t);
      setAffirmations(aff);
      setMyQuotes(mq);
      setFavoriteRows(favIds.map(parseFavorite));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();

  const filteredTasks = useMemo(() => {
    if (!q) return [];
    return taskLists.filter((list) => {
      if (matchesQuery(q, list.title)) return true;
      return (
        list.tasks?.some((st) => matchesQuery(q, st.content)) ?? false
      );
    });
  }, [taskLists, q]);

  const filteredAffirmations = useMemo(() => {
    if (!q) return [];
    return affirmations.filter((a) =>
      matchesQuery(
        q,
        a.text,
        "affirmation",
        ...dateSearchVariants(a.createdAt),
      ),
    );
  }, [affirmations, q]);

  const filteredMyQuotes = useMemo(() => {
    if (!q) return [];
    return myQuotes.filter((mq) =>
      matchesQuery(
        q,
        mq.quote,
        mq.author,
        "quote",
        ...dateSearchVariants(mq.createdAt),
      ),
    );
  }, [myQuotes, q]);

  const filteredFavorites = useMemo(() => {
    if (!q) return [];
    return favoriteRows.filter((f) => {
      const kind = f.kind === "affirmation" ? "affirmation" : "quote";
      return matchesQuery(
        q,
        f.quote,
        f.author,
        kind,
        "favorite",
      );
    });
  }, [favoriteRows, q]);

  const totalHits =
    filteredTasks.length +
    filteredAffirmations.length +
    filteredMyQuotes.length +
    filteredFavorites.length;

  const afterNav = () => {
    onNavigate?.();
  };

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div
        className="shrink-0 border-b-2 px-4 pb-3 pt-1"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div
          className="mx-auto mb-2 h-1 w-10 rounded-full"
          style={{ backgroundColor: theme.border }}
          aria-hidden
        />
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 flex-1 text-lg font-bold" style={{ color: theme.text }}>
            Search
          </h1>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg p-2 hover:opacity-80"
              style={{ color: theme.textSecondary }}
              aria-label="Close search"
            >
              <X className="size-5" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tasks, affirmations, quotes, authors, dates…"
          maxLength={512}
          className="mt-2 w-full rounded-lg border-2 px-3 py-2 text-sm"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.background,
            color: theme.text,
          }}
          autoComplete="off"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!q ? (
          <p className="py-8 text-center text-sm" style={{ color: theme.textSecondary }}>
            Type to search tasks, affirmations, quotes (and authors), saved
            favorites, and dates (e.g. year or month).
          </p>
        ) : totalHits === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: theme.textSecondary }}>
            No matches for &ldquo;{query.trim()}&rdquo;
          </p>
        ) : (
          <div className="space-y-6">
            {filteredTasks.length > 0 && (
              <section
                className="rounded-2xl border-2 p-3"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
                <p
                  className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: theme.textSecondary }}
                >
                  <ListTodo className="size-4" aria-hidden />
                  Task lists
                </p>
                <ul className="space-y-1">
                  {filteredTasks.map((list) => (
                    <li key={list.id ?? `list-${list.title ?? "x"}`}>
                      <Link
                        href={
                          list.id
                            ? `/task/${encodeURIComponent(list.id)}`
                            : "/planner?tab=tasks"
                        }
                        onClick={afterNav}
                        className="block rounded-xl border-2 px-3 py-2.5 hover:opacity-90"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: theme.card,
                        }}
                      >
                        <p className="font-medium leading-snug">
                          {list.title?.trim() || "Untitled list"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {filteredAffirmations.length > 0 && (
              <section
                className="rounded-2xl border-2 p-3"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
                <p
                  className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: theme.textSecondary }}
                >
                  <Sparkles className="size-4" aria-hidden />
                  My affirmations
                </p>
                <ul className="space-y-1">
                  {filteredAffirmations.map((a) => (
                    <li key={a.id}>
                      <Link
                        href="/affirmations"
                        onClick={afterNav}
                        className="block rounded-xl border-2 px-3 py-2.5 hover:opacity-90"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: theme.card,
                        }}
                      >
                        <p className="line-clamp-3 font-medium leading-snug">
                          {a.text}
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: theme.textSecondary }}
                        >
                          {new Date(a.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {filteredMyQuotes.length > 0 && (
              <section
                className="rounded-2xl border-2 p-3"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
                <p
                  className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: theme.textSecondary }}
                >
                  <PenLine className="size-4" aria-hidden />
                  My quotes
                </p>
                <ul className="space-y-1">
                  {filteredMyQuotes.map((mq) => (
                    <li key={mq.id}>
                      <Link
                        href="/created-by-me"
                        onClick={afterNav}
                        className="block rounded-xl border-2 px-3 py-2.5 hover:opacity-90"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: theme.card,
                        }}
                      >
                        <p className="line-clamp-3 font-medium leading-snug">
                          &ldquo;{mq.quote}&rdquo;
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: theme.textSecondary }}
                        >
                          {[mq.author?.trim(), new Date(mq.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {filteredFavorites.length > 0 && (
              <section
                className="rounded-2xl border-2 p-3"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
                <p
                  className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: theme.textSecondary }}
                >
                  <Heart className="size-4" aria-hidden />
                  Favorites
                </p>
                <ul className="space-y-1">
                  {filteredFavorites.map((f, idx) => (
                    <li
                      key={`${f.quote.slice(0, 48)}-${idx}`}
                    >
                      <Link
                        href="/favorites"
                        onClick={afterNav}
                        className="block rounded-xl border-2 px-3 py-2.5 hover:opacity-90"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: theme.card,
                        }}
                      >
                        <p className="line-clamp-3 font-medium leading-snug">
                          &ldquo;{f.quote}&rdquo;
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: theme.textSecondary }}
                        >
                          {f.author?.trim() || "Unknown"}
                          {f.kind === "affirmation"
                            ? " · Affirmation"
                            : " · Quote"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
