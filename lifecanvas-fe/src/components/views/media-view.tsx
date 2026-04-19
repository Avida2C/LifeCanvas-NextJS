"use client";

import {
  AlertCircle,
  Check,
  ExternalLink,
  FolderPlus,
  ImagePlus,
  Loader2,
  Pencil,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { MediaPreviewModal } from "@/components/media-preview-modal";
import { fileToGalleryDataUrl, isVideoDataUrl, newGalleryPhotoId } from "@/lib/media-utils";
import { subscribePhotosChanged } from "@/lib/photos-idb";
import {
  createAlbum,
  deleteAlbum,
  deletePhoto,
  getAlbums,
  getPhotos,
  savePhoto,
  updateAlbum,
  updatePhoto,
} from "@/lib/storage";
import type { Album, Photo } from "@/types";

function formatAlbumCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function MediaView() {
  const { theme } = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [modal, setModal] = useState<Photo | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [newAlbum, setNewAlbum] = useState("");
  const [showAlbum, setShowAlbum] = useState(false);
  const [detailsEditing, setDetailsEditing] = useState(false);
  const [manageAlbumsOpen, setManageAlbumsOpen] = useState(false);
  const [albumDrafts, setAlbumDrafts] = useState<
    Record<string, { name: string; description: string }>
  >({});
  const [albumRowSavingId, setAlbumRowSavingId] = useState<string | null>(null);
  const [albumBanner, setAlbumBanner] = useState<
    | null
    | { variant: "saving" | "success" | "error"; message: string }
  >(null);
  const albumBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAlbumBannerTimer = useCallback(() => {
    if (albumBannerTimerRef.current) {
      clearTimeout(albumBannerTimerRef.current);
      albumBannerTimerRef.current = null;
    }
  }, []);

  const dismissAlbumBanner = useCallback(() => {
    clearAlbumBannerTimer();
    setAlbumBanner(null);
  }, [clearAlbumBannerTimer]);

  const showAlbumBanner = useCallback(
    (
      message: string,
      variant: "saving" | "success" | "error",
      autoDismissMs?: number,
    ) => {
      clearAlbumBannerTimer();
      setAlbumBanner({ message, variant });
      if (autoDismissMs != null && variant !== "saving") {
        albumBannerTimerRef.current = setTimeout(() => {
          setAlbumBanner(null);
          albumBannerTimerRef.current = null;
        }, autoDismissMs);
      }
    },
    [clearAlbumBannerTimer],
  );

  const load = useCallback(async () => {
    const [p, a] = await Promise.all([getPhotos(), getAlbums()]);
    setPhotos(p);
    setAlbums(a);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribePhotosChanged(() => void load());
  }, [load]);

  useEffect(() => {
    if (manageAlbumsOpen && albums.length === 0) {
      setManageAlbumsOpen(false);
    }
  }, [manageAlbumsOpen, albums.length]);

  useEffect(() => {
    return () => clearAlbumBannerTimer();
  }, [clearAlbumBannerTimer]);

  const pickFiles = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = input.files;
      if (!files?.length) return;
      let failed = 0;
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await fileToGalleryDataUrl(files[i]);
        const ok = await savePhoto({
          id: newGalleryPhotoId(),
          uri: dataUrl,
          createdAt: new Date().toISOString(),
        });
        if (!ok) failed += 1;
      }
      if (failed > 0) {
        alert(
          failed === files.length
            ? "Could not save media. Try freeing device space or check this site’s storage permission in your browser."
            : `Saved ${files.length - failed} of ${files.length}. If this keeps happening, free space on your device or check browser storage settings.`,
        );
      }
      void load();
    };
    input.click();
  };

  const openModal = (p: Photo) => {
    setModal(p);
    setName(p.name || "");
    setDesc(p.description || "");
    setDetailsEditing(false);
  };

  const saveDetails = async () => {
    if (!modal) return;
    await updatePhoto(modal.id, {
      name: name.trim() || undefined,
      description: desc.trim() || undefined,
    });
    setModal(null);
    setDetailsEditing(false);
    void load();
  };

  const removePhoto = async () => {
    if (!modal) return;
    if (
      !confirm(
        "Delete this photo or video from your library? This cannot be undone.",
      )
    )
      return;
    await deletePhoto(modal.id);
    setModal(null);
    setDetailsEditing(false);
    void load();
  };

  const addAlbum = async () => {
    if (!newAlbum.trim()) return;
    await createAlbum(newAlbum.trim());
    setNewAlbum("");
    setShowAlbum(false);
    void load();
  };

  const openManageAlbums = () => {
    dismissAlbumBanner();
    const next: Record<string, { name: string; description: string }> = {};
    for (const a of albums) {
      next[a.id] = { name: a.name, description: a.description ?? "" };
    }
    setAlbumDrafts(next);
    setManageAlbumsOpen(true);
  };

  const saveAlbumRow = async (albumId: string) => {
    const d = albumDrafts[albumId];
    if (!d) return;
    clearAlbumBannerTimer();
    setAlbumRowSavingId(albumId);
    const label = d.name.trim() || "Album";
    showAlbumBanner("Saving album…", "saving");
    try {
      await updateAlbum(albumId, {
        name: d.name,
        description: d.description,
      });
      await load();
      showAlbumBanner(`Saved “${label}”`, "success", 2800);
    } finally {
      setAlbumRowSavingId(null);
    }
  };

  const removeAlbumFromManage = async (a: Album) => {
    if (
      !confirm(
        `Delete album "${a.name}"? Photos and videos stay in All photos & videos.`,
      )
    )
      return;
    await deleteAlbum(a.id);
    setAlbumDrafts((prev) => {
      const n = { ...prev };
      delete n[a.id];
      return n;
    });
    void load();
    showAlbumBanner(`Deleted “${a.name}”`, "success", 2800);
  };

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title="Media"
        theme={theme}
        actions={[
          { icon: ImagePlus, label: "Add photos & videos", onClick: pickFiles },
          {
            icon: FolderPlus,
            label: "New album",
            onClick: () => setShowAlbum(true),
          },
        ]}
      />
      {albumBanner ? (
        <div
          className="fixed left-0 right-0 z-[85] flex min-h-12 items-center justify-center gap-2 border-b-2 px-3 py-2 text-sm font-medium shadow-sm"
          style={{
            top: "3.25rem",
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          }}
          role="status"
          aria-live="polite"
        >
          {albumBanner.variant === "saving" ? (
            <Loader2 className="size-4 shrink-0 animate-spin" style={{ color: theme.primary }} aria-hidden />
          ) : albumBanner.variant === "success" ? (
            <Check className="size-4 shrink-0" style={{ color: theme.success }} aria-hidden />
          ) : (
            <AlertCircle className="size-4 shrink-0" style={{ color: theme.error }} aria-hidden />
          )}
          <span className="min-w-0 flex-1 text-center">{albumBanner.message}</span>
          <button
            type="button"
            onClick={dismissAlbumBanner}
            className="shrink-0 rounded p-1 opacity-70 hover:opacity-100"
            style={{ color: theme.text }}
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      <div
        className={`flex-1 overflow-y-auto p-2 pb-24 ${albumBanner ? "pt-14" : ""}`}
      >
        {albums.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-2 px-2">
              <p className="font-bold" style={{ color: theme.text }}>
                Albums
              </p>
              <button
                type="button"
                onClick={openManageAlbums}
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: theme.primary }}
              >
                <Settings2 className="size-4 shrink-0" aria-hidden />
                Manage
              </button>
            </div>
            <div
              className="-mx-2 snap-x snap-proximity overflow-x-auto overflow-y-visible scroll-smooth pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
              style={{ scrollbarColor: `${theme.border} transparent` }}
            >
              <div className="flex w-max gap-2 px-2 pr-3">
                {albums.map((a) => (
                  <Link
                    key={a.id}
                    href={`/album/${a.id}?name=${encodeURIComponent(a.name)}`}
                    className="block w-[calc((min(100vw,42rem)-2rem)/4)] min-w-[3.75rem] max-w-[10rem] shrink-0 snap-start"
                  >
                  <div
                    className="aspect-square overflow-hidden rounded-lg border-2"
                    style={{ borderColor: theme.border }}
                  >
                    {a.coverPhotoUri ? (
                      isVideoDataUrl(a.coverPhotoUri) ? (
                        <video
                          src={a.coverPhotoUri}
                          className="size-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          controlsList="nodownload"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          aria-hidden
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.coverPhotoUri} alt="" className="size-full object-cover" />
                      )
                    ) : (
                      <div
                        className="flex size-full items-center justify-center text-4xl"
                        style={{ backgroundColor: theme.surface }}
                      >
                        📁
                      </div>
                    )}
                  </div>
                  <p
                    className="mt-1.5 truncate text-center text-xs font-semibold leading-tight"
                    style={{ color: theme.text }}
                  >
                    {a.name}
                  </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
        <p className="mb-2 px-2 font-bold" style={{ color: theme.text }}>
          All photos & videos
        </p>
        <div className="grid grid-cols-4 gap-0.5">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              className="aspect-square overflow-hidden"
              onClick={() => openModal(p)}
            >
              {isVideoDataUrl(p.uri) ? (
                <video
                  src={p.uri}
                  className="size-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  controlsList="nodownload"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  aria-hidden
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.uri} alt="" className="size-full object-cover" />
              )}
            </button>
          ))}
        </div>
        {photos.length === 0 && (
          <p className="py-12 text-center text-sm" style={{ color: theme.textSecondary }}>
            Add photos or videos with the + button
          </p>
        )}
      </div>

      {manageAlbumsOpen && albums.length > 0 && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center">
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border-2 sm:max-h-[85vh] sm:rounded-2xl"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
            role="dialog"
            aria-labelledby="manage-albums-title"
          >
            <div
              className="flex shrink-0 items-center justify-between border-b-2 px-4 py-3"
              style={{ borderColor: theme.border }}
            >
              <h2 id="manage-albums-title" className="text-lg font-bold" style={{ color: theme.text }}>
                Manage albums
              </h2>
              <button
                type="button"
                onClick={() => {
                  dismissAlbumBanner();
                  setManageAlbumsOpen(false);
                }}
                className="flex items-center gap-1.5 text-sm font-medium"
                style={{ color: theme.primary }}
              >
                <Check className="size-4" aria-hidden />
                Done
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {albums.map((a) => {
                const d = albumDrafts[a.id] ?? {
                  name: a.name,
                  description: a.description ?? "",
                };
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border-2 p-3"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="mb-3 flex gap-3">
                      <div
                        className="size-14 shrink-0 overflow-hidden rounded-lg border"
                        style={{ borderColor: theme.border }}
                      >
                        {a.coverPhotoUri ? (
                          isVideoDataUrl(a.coverPhotoUri) ? (
                            <video
                              src={a.coverPhotoUri}
                              className="size-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              controlsList="nodownload"
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              aria-hidden
                            />
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={a.coverPhotoUri} alt="" className="size-full object-cover" />
                          )
                        ) : (
                          <div
                            className="flex size-full items-center justify-center text-2xl"
                            style={{ backgroundColor: theme.surface }}
                          >
                            📁
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-xs" style={{ color: theme.textSecondary }}>
                          Created{" "}
                          {a.createdAt ? formatAlbumCreatedAt(a.createdAt) : "—"}
                        </p>
                        <label className="block">
                          <span className="mb-0.5 block text-xs" style={{ color: theme.textSecondary }}>
                            Name
                          </span>
                          <input
                            value={d.name}
                            onChange={(e) =>
                              setAlbumDrafts((prev) => ({
                                ...prev,
                                [a.id]: {
                                  ...(prev[a.id] ?? {
                                    name: a.name,
                                    description: a.description ?? "",
                                  }),
                                  name: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border-2 px-2 py-1.5 text-sm"
                            style={{
                              borderColor: theme.border,
                              color: theme.text,
                              backgroundColor: theme.surface,
                            }}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-0.5 block text-xs" style={{ color: theme.textSecondary }}>
                            Description
                          </span>
                          <textarea
                            value={d.description}
                            onChange={(e) =>
                              setAlbumDrafts((prev) => ({
                                ...prev,
                                [a.id]: {
                                  ...(prev[a.id] ?? {
                                    name: a.name,
                                    description: a.description ?? "",
                                  }),
                                  description: e.target.value,
                                },
                              }))
                            }
                            rows={2}
                            placeholder="Optional"
                            className="w-full resize-y rounded-lg border-2 px-2 py-1.5 text-sm"
                            style={{
                              borderColor: theme.border,
                              color: theme.text,
                              backgroundColor: theme.surface,
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div
                      className="mt-3 border-t px-[0.2rem] pt-3"
                      style={{ borderColor: theme.divider }}
                    >
                    <div className="flex min-w-0 flex-nowrap items-center justify-end gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                      <button
                        type="button"
                        disabled={albumRowSavingId === a.id}
                        onClick={() => void saveAlbumRow(a.id)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-70 sm:gap-1.5 sm:px-2.5 sm:text-sm"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {albumRowSavingId === a.id ? (
                          <Loader2 className="size-3.5 shrink-0 animate-spin sm:size-4" aria-hidden />
                        ) : (
                          <Save className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                        )}
                        {albumRowSavingId === a.id ? "Saving…" : "Save"}
                      </button>
                      <Link
                        href={`/album/${a.id}?name=${encodeURIComponent(d.name.trim() || a.name)}`}
                        title="Open album"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border-2 px-2 py-1.5 text-xs font-medium sm:gap-1.5 sm:px-2.5 sm:text-sm"
                        style={{ borderColor: theme.border, color: theme.text }}
                      >
                        <ExternalLink className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                        Open
                      </Link>
                      <button
                        type="button"
                        title="Delete album"
                        onClick={() => void removeAlbumFromManage(a)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-500 px-2 py-1.5 text-xs font-medium text-white sm:gap-1.5 sm:px-2.5 sm:text-sm"
                      >
                        <Trash2 className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                        Delete
                      </button>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAlbum && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-xl border-2 p-4"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            <p className="font-bold" style={{ color: theme.text }}>
              New album
            </p>
            <input
              value={newAlbum}
              onChange={(e) => setNewAlbum(e.target.value)}
              className="mt-2 w-full rounded border-2 px-2 py-2"
              style={{ borderColor: theme.border, color: theme.text }}
              placeholder="Album name"
            />
            <div
              className="mt-3 flex flex-nowrap justify-end gap-1 border-t px-[0.2rem] pt-3"
              style={{ borderColor: theme.divider }}
            >
              <button
                type="button"
                onClick={() => setShowAlbum(false)}
                className="inline-flex min-w-0 shrink-0 items-center justify-center gap-1 rounded border px-3 py-2"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <X className="size-4 shrink-0" aria-hidden />
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void addAlbum()}
                className="inline-flex min-w-0 shrink-0 items-center justify-center gap-1 rounded px-3 py-2 text-white"
                style={{ backgroundColor: theme.primary }}
              >
                <FolderPlus className="size-4 shrink-0" aria-hidden />
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <MediaPreviewModal
          theme={theme}
          photo={modal}
          name={name}
          desc={desc}
          detailsVisible={detailsEditing}
          onClose={() => {
            setModal(null);
            setDetailsEditing(false);
          }}
          onNameChange={setName}
          onDescChange={setDesc}
          onSaveDetails={() => void saveDetails()}
          actions={
            <>
              <button
                type="button"
                onClick={() => setDetailsEditing((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <Pencil className="size-4 shrink-0" aria-hidden />
                {detailsEditing ? "Hide details" : "Edit details"}
              </button>
              <div className="flex min-w-0 flex-nowrap gap-1">
                <button
                  type="button"
                  onClick={() => void removePhoto()}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white"
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setDetailsEditing(false);
                  }}
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
      )}
    </div>
  );
}
