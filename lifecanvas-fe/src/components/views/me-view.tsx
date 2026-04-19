"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Pencil, Trash2, X } from "lucide-react";
import { GiLotusFlower } from "react-icons/gi";
import { ImQuotesLeft, ImQuotesRight } from "react-icons/im";
import { MediaPreviewModal } from "@/components/media-preview-modal";
import { useTheme } from "@/components/providers/theme-provider";
import {
  getAffirmations,
  getAlbums,
  getDefaultAffirmation,
  getDefaultQuote,
  getFavorites,
  getJournalEntries,
  getMyQuotes,
  getNotes,
  getPhotos,
  getReminders,
  getTaskLists,
  getUserSettings,
  saveUserSettings,
  deletePhoto,
  updatePhoto,
} from "@/lib/storage";
import { canUseAsAlbumCover } from "@/lib/media-utils";
import { subscribePhotosChanged } from "@/lib/photos-idb";
import type { Photo, Quote, UserSettings } from "@/types";

function parseFavoriteQuotes(raw: string[]): Quote[] {
  return raw.map((id) => {
    try {
      return JSON.parse(id) as Quote;
    } catch {
      return { quote: id, author: "Unknown" };
    }
  });
}

function defaultQuoteAuthorFromFavorites(
  dq: string | null,
  favorites: string[],
): string | null {
  if (!dq) return null;
  for (const id of favorites) {
    try {
      const q = JSON.parse(id) as Quote;
      if (q.quote === dq) return q.author?.trim() || null;
    } catch {
      if (id === dq) return "Unknown";
    }
  }
  return null;
}

/** Resize and compress for localStorage-friendly profile photos */
function fileToAvatarDataUrl(file: File, maxDim = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unsupported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not encode image"));
            return;
          }
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(new Error("Read failed"));
          r.readAsDataURL(blob);
        },
        "image/jpeg",
        0.88,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}

function greetingForHour(h: number): string {
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function MeView() {
  const { theme, isDarkMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [defaultQuoteAuthor, setDefaultQuoteAuthor] = useState<string | null>(null);
  const [stats, setStats] = useState({
    journals: 0,
    notes: 0,
    taskDone: 0,
    taskOpen: 0,
    photos: 0,
    favorites: 0,
    myQuotes: 0,
    affirmations: 0,
    albums: 0,
    reminders: 0,
  });
  const [defaultQuote, setDefaultQuote] = useState<string | null>(null);
  const [defaultAffirmation, setDefaultAffirmation] = useState<string | null>(null);
  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [favoritePreview, setFavoritePreview] = useState<Quote[]>([]);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewDesc, setPreviewDesc] = useState("");
  const [previewDetailsEditing, setPreviewDetailsEditing] = useState(false);

  const load = useCallback(async () => {
    // Resolve profile + daily inspiration from fast storage first so the Me quote/affirmation
    // block is not blocked by IndexedDB photo reads or large journal/task payloads.
    const quickPromise = Promise.all([
      getUserSettings(),
      getDefaultQuote(),
      getDefaultAffirmation(),
      getFavorites(),
    ]);

    const heavyPromise = Promise.all([
      getJournalEntries(),
      getNotes(),
      getTaskLists(),
      getPhotos(),
      getAlbums(),
      getAffirmations(),
      getReminders(),
      getMyQuotes(),
    ]);

    const [settings, dq, da, favorites] = await quickPromise;

    setUserSettings(settings);
    setDefaultQuote(dq);
    setDefaultAffirmation(da);
    setFavoritePreview(parseFavoriteQuotes(favorites).slice(0, 3));
    setDefaultQuoteAuthor(defaultQuoteAuthorFromFavorites(dq, favorites));

    const [
      journalEntries,
      notes,
      taskLists,
      photos,
      albumsData,
      affirmationsList,
      reminders,
      myQuotesList,
    ] = await heavyPromise;

    let taskDone = 0;
    let taskOpen = 0;
    for (const tl of taskLists) {
      for (const t of tl.tasks) {
        if (t.done) taskDone += 1;
        else taskOpen += 1;
      }
    }

    const stillPhotosOnly = photos.filter((p) => canUseAsAlbumCover(p.uri));

    setStats({
      journals: journalEntries.length,
      notes: notes.length,
      taskDone,
      taskOpen,
      photos: stillPhotosOnly.length,
      favorites: favorites.length,
      myQuotes: myQuotesList.length,
      affirmations: affirmationsList.length,
      albums: albumsData.length,
      reminders: reminders.length,
    });
    setRecentPhotos(
      [...stillPhotosOnly].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribePhotosChanged(() => void load());
  }, [load]);

  useEffect(() => {
    if (userSettings && !nameEditing) {
      setNameDraft(userSettings.nickname?.trim() || userSettings.name || "");
    }
  }, [userSettings, nameEditing]);

  useEffect(() => {
    if (!previewPhoto) return;
    setPreviewName(previewPhoto.name || "");
    setPreviewDesc(previewPhoto.description || "");
    setPreviewDetailsEditing(false);
  }, [previewPhoto]);

  const closePhotoPreview = useCallback(() => {
    setPreviewPhoto(null);
    setPreviewDetailsEditing(false);
  }, []);

  const savePhotoPreviewDetails = useCallback(async () => {
    if (!previewPhoto) return;
    await updatePhoto(previewPhoto.id, {
      name: previewName.trim() || undefined,
      description: previewDesc.trim() || undefined,
    });
    closePhotoPreview();
    void load();
  }, [previewPhoto, previewName, previewDesc, closePhotoPreview, load]);

  const removePhotoFromPreview = useCallback(async () => {
    if (!previewPhoto) return;
    if (
      !confirm(
        "Delete this photo or video from your library? This cannot be undone.",
      )
    )
      return;
    await deletePhoto(previewPhoto.id);
    closePhotoPreview();
    void load();
  }, [previewPhoto, closePhotoPreview, load]);

  const displayName = userSettings?.nickname?.trim() || userSettings?.name || "Friend";
  const journalAndNotesTotal = stats.journals + stats.notes;
  const createdQuotesAndAffirmations = stats.myQuotes + stats.affirmations;

  const saveName = async () => {
    if (!userSettings) return;
    const next = nameDraft.trim();
    if (!next) return;
    setProfileBusy(true);
    const merged: UserSettings = {
      ...userSettings,
      name: next,
      nickname: next,
    };
    await saveUserSettings(merged);
    setUserSettings(merged);
    setNameEditing(false);
    setProfileBusy(false);
  };

  const onPickAvatar = () => fileInputRef.current?.click();

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userSettings) return;
    if (!file.type.startsWith("image/")) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const merged: UserSettings = { ...userSettings, avatarDataUrl: dataUrl };
      await saveUserSettings(merged);
      setUserSettings(merged);
    } catch {
      alert("Could not use this image. Try a smaller JPG or PNG.");
    } finally {
      setAvatarBusy(false);
    }
  };

  const cardStyle = {
    backgroundColor: theme.card,
    borderColor: theme.border,
  } as const;

  const hour = new Date().getHours();

  return (
    <div className="pb-4" style={{ backgroundColor: theme.background, color: theme.text }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onAvatarFile(e)}
      />

      {/* Profile hero */}
      <section
        className="border-b-2 px-4 pb-5 pt-6 text-center"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>
          {greetingForHour(hour)}, {displayName.split(" ")[0] || "there"}
        </p>

        <div className="mt-5 flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
          <div className="sticky top-3 z-20 flex shrink-0 flex-col items-center">
            <div className="relative mx-auto inline-flex">
              <button
                type="button"
                onClick={() => onPickAvatar()}
                disabled={avatarBusy || !userSettings}
                className="flex size-24 items-center justify-center overflow-hidden rounded-full border-4 text-3xl font-bold text-white shadow-md transition-opacity disabled:opacity-60"
                style={{ borderColor: theme.primary, backgroundColor: theme.avatarBg }}
                aria-label="Change profile photo"
              >
                {userSettings?.avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URLs from local storage
                  <img
                    src={userSettings.avatarDataUrl}
                    alt=""
                    className="size-full object-cover object-center"
                  />
                ) : (
                  (userSettings?.nickname?.trim() || userSettings?.name)?.charAt(0).toUpperCase() ?? "U"
                )}
              </button>
              <button
                type="button"
                onClick={() => onPickAvatar()}
                disabled={avatarBusy || !userSettings}
                className="absolute -bottom-1 -right-1 z-10 flex size-10 items-center justify-center rounded-full border-2 shadow-lg transition-opacity disabled:opacity-60"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.primary,
                  color: theme.primary,
                }}
                aria-label="Upload profile photo"
                title="Upload photo"
              >
                <Camera className="size-5" />
              </button>
            </div>
          </div>

          <div className="min-w-0 w-full max-w-md flex-1 text-center">
            {nameEditing ? (
              <div className="mx-auto max-w-sm space-y-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="w-full rounded-xl border-2 px-3 py-2 text-lg font-semibold"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    color: theme.text,
                  }}
                  placeholder="Your name"
                  autoFocus
                />
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    disabled={profileBusy || !nameDraft.trim()}
                    onClick={() => void saveName()}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNameEditing(false);
                      setNameDraft(userSettings?.nickname?.trim() || userSettings?.name || "");
                    }}
                    className="rounded-xl border-2 px-4 py-2 text-sm font-medium"
                    style={{ borderColor: theme.border, color: theme.text }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold leading-none tracking-tight">{displayName}</h1>
                <div className="mt-0.5 inline-block pr-4">
                  <button
                    type="button"
                    onClick={() => setNameEditing(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-0.5 text-sm font-medium"
                    style={{ color: theme.primary }}
                    aria-label="Edit name"
                  >
                    <Pencil className="size-4 shrink-0" />
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Daily inspiration */}
      <section className="mx-4 mt-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
          Daily inspiration
        </h2>
        <div
          className="rounded-2xl border-2 px-2.5 py-3"
          style={{
            ...cardStyle,
            backgroundColor: isDarkMode ? theme.card : "#fffefe",
          }}
        >
          {defaultQuote || defaultAffirmation ? (
            <div className="flex flex-col gap-4">
              {defaultAffirmation ? (
                <div
                  className="flex w-full items-center gap-4 border-b pb-2.5"
                  style={{ borderColor: isDarkMode ? theme.divider : "#f8d6cb" }}
                >
                  <GiLotusFlower className="h-6 w-8 shrink-0" style={{ color: theme.primary }} aria-hidden />
                  <p
                    className="min-w-0 flex-1 text-base italic leading-normal"
                    style={{
                      color: isDarkMode ? theme.textSecondary : "#555555",
                      fontFamily: "var(--font-quote-condensed), sans-serif",
                    }}
                  >
                    {defaultAffirmation}
                  </p>
                </div>
              ) : null}
              {defaultQuote ? (
                <div
                  className="flex w-full flex-col items-end border-b pb-2.5 last:border-b-0 last:pb-0"
                  style={{ borderColor: isDarkMode ? theme.divider : "#f8d6cb" }}
                >
                  <div className="flex w-full items-start gap-4">
                    <ImQuotesLeft className="size-8 shrink-0" style={{ color: theme.primary }} aria-hidden />
                    <p
                      className="min-w-0 flex-1 text-base italic leading-normal"
                      style={{
                        color: isDarkMode ? theme.textSecondary : "#555555",
                        fontFamily: "var(--font-quote-condensed), sans-serif",
                      }}
                    >
                      {defaultQuote}
                    </p>
                    <ImQuotesRight className="size-8 shrink-0" style={{ color: theme.primary }} aria-hidden />
                  </div>
                  {defaultQuoteAuthor ? (
                    <p
                      className="mt-1 w-full text-right text-base uppercase not-italic leading-normal"
                      style={{
                        color: theme.primary,
                        fontFamily: "var(--font-quote-sans), sans-serif",
                      }}
                    >
                      {defaultQuoteAuthor}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-center text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
              Pin something in{" "}
              <Link href="/favorites" className="font-semibold underline" style={{ color: theme.primary }}>
                Favorites
              </Link>
              , or write affirmations in{" "}
              <Link href="/affirmations" className="font-semibold underline" style={{ color: theme.primary }}>
                My affirmations
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* Analytics */}
      <section className="mx-4 mt-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
          Your activity
        </h2>
        <p className="mb-3 text-sm" style={{ color: theme.textSecondary }}>
          Life Canvas member
          {userSettings?.memberSince ? ` · since ${userSettings.memberSince}` : ""}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(
            [
              [
                "Memories",
                journalAndNotesTotal,
                `${stats.journals} journal${stats.journals === 1 ? "" : "s"} · ${stats.notes} note${stats.notes === 1 ? "" : "s"}`,
              ],
              ["Saved", stats.favorites, "Hearted from Inspire"],
              [
                "Gallery",
                stats.photos,
                `${stats.albums} album${stats.albums === 1 ? "" : "s"} · photos & videos`,
              ],
              [
                "Created",
                createdQuotesAndAffirmations,
                `${stats.myQuotes} quote${stats.myQuotes === 1 ? "" : "s"} · ${stats.affirmations} affirmation${stats.affirmations === 1 ? "" : "s"}`,
              ],
              [
                "Tasks",
                stats.taskOpen,
                `${stats.taskDone} completed`,
              ],
              ["Reminders", stats.reminders, "In Planner"],
            ] as const
          ).map(([label, value, hint]) => (
            <div
              key={label}
              className="rounded-2xl border-2 px-3 py-3"
              style={cardStyle}
            >
              <p className="text-2xl font-bold tabular-nums" style={{ color: theme.statNumber }}>
                {value}
              </p>
              <p className="text-xs font-semibold" style={{ color: theme.text }}>
                {label}
              </p>
              <p className="mt-1 text-[11px] leading-snug" style={{ color: theme.textSecondary }}>
                {hint}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Favorites preview */}
      <section className="mx-4 mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
            Favorites
          </h2>
          <Link href="/favorites" className="text-xs font-semibold" style={{ color: theme.primary }}>
            See all ({stats.favorites})
          </Link>
        </div>
        <div className="space-y-2">
          {favoritePreview.length === 0 ? (
            <div className="rounded-2xl border-2 p-4 text-center text-sm" style={cardStyle}>
              <p style={{ color: theme.textSecondary }}>
                Heart quotes and affirmations in{" "}
                <Link href="/inspire" className="font-semibold underline" style={{ color: theme.primary }}>
                  Inspire
                </Link>{" "}
                to fill this space.
              </p>
            </div>
          ) : (
            favoritePreview.map((q, i) => (
              <div
                key={i}
                className="rounded-xl border-2 px-3 py-2.5"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <p className="line-clamp-2 text-sm italic" style={{ color: theme.text }}>
                  &ldquo;{q.quote}&rdquo;
                </p>
                {q.author && q.author !== "Unknown" ? (
                  <p className="mt-1 text-right text-xs" style={{ color: theme.textSecondary }}>
                    — {q.author}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Photos */}
      <section className="mx-4 mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
            Photos
          </h2>
          <Link href="/media" className="text-xs font-semibold" style={{ color: theme.primary }}>
            All Media
          </Link>
        </div>
        {recentPhotos.length === 0 ? (
          <div className="rounded-2xl border-2 p-4 text-center text-sm" style={cardStyle}>
            <p style={{ color: theme.textSecondary }}>
              No photos yet. Add some in{" "}
              <Link href="/media" className="font-semibold underline" style={{ color: theme.primary }}>
                All Media
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {recentPhotos.slice(0, 8).map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setPreviewPhoto(photo)}
                className="relative aspect-square overflow-hidden rounded-xl border-2 transition-opacity hover:opacity-95"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
                aria-label="Open preview"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- gallery data URLs */}
                <img
                  src={photo.uri}
                  alt=""
                  className="size-full object-cover object-center"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {previewPhoto ? (
        <MediaPreviewModal
          theme={theme}
          photo={previewPhoto}
          name={previewName}
          desc={previewDesc}
          detailsVisible={previewDetailsEditing}
          onClose={closePhotoPreview}
          onNameChange={setPreviewName}
          onDescChange={setPreviewDesc}
          onSaveDetails={() => void savePhotoPreviewDetails()}
          actions={
            <>
              <Link
                href="/media"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: theme.primary }}
                onClick={closePhotoPreview}
              >
                All media
              </Link>
              <button
                type="button"
                onClick={() => setPreviewDetailsEditing((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <Pencil className="size-4 shrink-0" aria-hidden />
                {previewDetailsEditing ? "Hide details" : "Edit details"}
              </button>
              <div className="flex min-w-0 flex-nowrap gap-1">
                <button
                  type="button"
                  onClick={() => void removePhotoFromPreview()}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white"
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={closePhotoPreview}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border-2 py-2 text-sm font-medium"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  <X className="size-4 shrink-0" aria-hidden />
                  Close
                </button>
              </div>
            </>
          }
        />
      ) : null}
    </div>
  );
}
