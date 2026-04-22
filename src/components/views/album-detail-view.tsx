"use client";

import {
  Check,
  FolderMinus,
  ImagePlus,
  Images,
  Pencil,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDeleteMediaDialog } from "@/components/confirm-delete-media-dialog";
import { MediaPreviewModal } from "@/components/media-preview-modal";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import {
  canUseAsAlbumCover,
  fileToGalleryDataUrl,
  imageDataUrlToAvatarDataUrl,
  isVideoDataUrl,
  newGalleryPhotoId,
} from "@/lib/media-utils";
import {
  deletePhoto,
  getAlbumPhotos,
  getAlbums,
  getPhotos,
  getUserSettings,
  movePhotoToAlbum,
  savePhoto,
  saveUserSettings,
  setAlbumCover,
  updatePhoto,
} from "@/lib/storage";
import type { Photo } from "@/types";

/** Album detail workspace for media management, cover, and profile usage actions. */
export function AlbumDetailView({
  albumId,
  albumName,
}: {
  albumId: string;
  albumName: string;
}) {
  const { theme } = useTheme();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [modal, setModal] = useState<Photo | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [libraryCandidates, setLibraryCandidates] = useState<Photo[]>([]);
  const [selectedFromLibrary, setSelectedFromLibrary] = useState<Set<string>>(new Set());
  const [coverPhotoId, setCoverPhotoId] = useState<string | undefined>(undefined);
  const [detailsEditing, setDetailsEditing] = useState(false);
  const [albumMeta, setAlbumMeta] = useState<{
    name: string;
    description?: string;
  } | null>(null);
  const [profilePhotoBusy, setProfilePhotoBusy] = useState(false);
  const [confirmDeleteFromLibraryOpen, setConfirmDeleteFromLibraryOpen] =
    useState(false);
  const [profileRef, setProfileRef] = useState<{
    avatarDataUrl?: string;
    avatarGalleryPhotoId?: string;
  } | null>(null);

  const load = useCallback(async () => {
    const [albumPhotos, albums, settings] = await Promise.all([
      getAlbumPhotos(albumId),
      getAlbums(),
      getUserSettings(),
    ]);
    setPhotos(albumPhotos);
    const album = albums.find((a) => a.id === albumId);
    setCoverPhotoId(album?.coverPhotoId);
    setAlbumMeta(
      album
        ? { name: album.name, description: album.description }
        : null,
    );
    setProfileRef(
      settings
        ? {
            avatarDataUrl: settings.avatarDataUrl,
            avatarGalleryPhotoId: settings.avatarGalleryPhotoId,
          }
        : null,
    );
  }, [albumId]);

  const isPhotoUsedAsProfile = useCallback(
    (p: Photo) =>
      Boolean(
        profileRef &&
          ((profileRef.avatarGalleryPhotoId &&
            p.id === profileRef.avatarGalleryPhotoId) ||
            (profileRef.avatarDataUrl && p.uri === profileRef.avatarDataUrl)),
      ),
    [profileRef],
  );

  useEffect(() => {
    void load();
  }, [load]);

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
          albumId,
        });
        if (!ok) failed += 1;
      }
      if (failed > 0) {
        alert(
          failed === files.length
            ? "Could not save media. Try freeing device space or check this site’s storage permission in your browser."
            : `Saved ${files.length - failed} of ${files.length}. If this keeps happening, free space or check browser storage settings.`,
        );
      }
      void load();
    };
    input.click();
  };

  const openLibraryPicker = async () => {
    const all = await getPhotos();
    const notInThisAlbum = all.filter((p) => p.albumId !== albumId);
    setLibraryCandidates(notInThisAlbum);
    setSelectedFromLibrary(new Set());
    setLibraryPickerOpen(true);
  };

  const toggleLibrarySelect = (id: string) => {
    setSelectedFromLibrary((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelectedFromLibrary = async () => {
    if (selectedFromLibrary.size === 0) return;
    for (const id of selectedFromLibrary) {
      await movePhotoToAlbum(id, albumId);
    }
    setLibraryPickerOpen(false);
    setSelectedFromLibrary(new Set());
    void load();
  };

  const firstImplicitCoverPhoto = photos.find((p) => canUseAsAlbumCover(p.uri));
  const isModalPhotoAlbumCover =
    !!modal &&
    ((modal.id === coverPhotoId && canUseAsAlbumCover(modal.uri)) ||
      (coverPhotoId === undefined && firstImplicitCoverPhoto?.id === modal.id));

  const modalCanBeCover = !!modal && canUseAsAlbumCover(modal.uri);

  const executeDeletePhotoFromLibrary = useCallback(async () => {
    if (!modal) return;
    await deletePhoto(modal.id);
    setConfirmDeleteFromLibraryOpen(false);
    setModal(null);
    setDetailsEditing(false);
    void load();
  }, [modal, load]);

  useEffect(() => {
    if (!modal) setConfirmDeleteFromLibraryOpen(false);
  }, [modal]);

  const useModalAsProfilePhoto = useCallback(async () => {
    if (!modal) return;
    if (isVideoDataUrl(modal.uri)) return;
    setProfilePhotoBusy(true);
    try {
      const settings = await getUserSettings();
      if (!settings) {
        alert("Sign in to set a profile photo.");
        return;
      }
      const dataUrl = await imageDataUrlToAvatarDataUrl(modal.uri);
      await saveUserSettings({
        ...settings,
        avatarDataUrl: dataUrl,
        avatarGalleryPhotoId: modal.id,
      });
      setProfileRef({
        avatarDataUrl: dataUrl,
        avatarGalleryPhotoId: modal.id,
      });
      setModal(null);
      setDetailsEditing(false);
    } catch {
      alert("Could not use this image as your profile photo.");
    } finally {
      setProfilePhotoBusy(false);
    }
  }, [modal]);

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title={albumMeta?.name ?? albumName}
        theme={theme}
        actions={[
          { icon: Images, label: "Add from library", onClick: () => void openLibraryPicker() },
          { icon: ImagePlus, label: "Upload new media", onClick: pickFiles },
        ]}
      />
      {albumMeta?.description?.trim() ? (
        <p
          className="border-b px-3 py-2 text-sm leading-snug"
          style={{ borderColor: theme.divider, color: theme.textSecondary }}
        >
          {albumMeta.description.trim()}
        </p>
      ) : null}
      <div className="grid grid-cols-3 gap-0.5 p-1 pb-24">
        {photos.map((p) => {
          const profilePic = isPhotoUsedAsProfile(p);
          return (
            <button
              key={p.id}
              type="button"
              className="relative aspect-square overflow-hidden"
              onClick={() => {
                setModal(p);
                setName(p.name || "");
                setDesc(p.description || "");
                setDetailsEditing(false);
              }}
              aria-label={
                profilePic ? "Open photo (profile picture)" : "Open photo"
              }
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
              {profilePic ? (
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-black/70 py-0.5 text-[0.6rem] font-bold leading-none text-white"
                  aria-hidden
                >
                  <User className="size-2.5 shrink-0" strokeWidth={2.5} />
                  Profile
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {photos.length === 0 && (
        <p className="py-12 text-center text-sm" style={{ color: theme.textSecondary }}>
          Add photos or videos to this album
        </p>
      )}

      {libraryPickerOpen && (
        <div className="fixed inset-0 z-[85] flex flex-col bg-black/60">
          <div
            className="flex max-h-[85vh] flex-1 flex-col rounded-t-2xl border-2 sm:mx-auto sm:mt-8 sm:max-h-[80vh] sm:max-w-2xl sm:rounded-2xl"
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
          >
            <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: theme.border }}>
              <p className="font-bold" style={{ color: theme.text }}>
                Add from library
              </p>
              <button
                type="button"
                onClick={() => setLibraryPickerOpen(false)}
                className="rounded px-2 py-1 text-sm"
                style={{ color: theme.textSecondary }}
              >
                Cancel
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {libraryCandidates.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: theme.textSecondary }}>
                  No other photos or videos in your library. Upload from “All media” first, or use Upload new media.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1">
                  {libraryCandidates.map((p) => {
                    const selected = selectedFromLibrary.has(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleLibrarySelect(p.id)}
                        className="relative aspect-square overflow-hidden"
                        style={{
                          boxShadow: selected ? `inset 0 0 0 3px ${theme.primary}` : undefined,
                        }}
                      >
                        {selected ? (
                          <span
                            className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full text-white"
                            style={{ backgroundColor: theme.primary }}
                          >
                            <Check className="size-3" strokeWidth={3} aria-hidden />
                          </span>
                        ) : null}
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
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2 border-t p-3" style={{ borderColor: theme.border }}>
              <button
                type="button"
                onClick={() => setLibraryPickerOpen(false)}
                className="flex-1 rounded-lg border-2 py-2 font-medium"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedFromLibrary.size === 0}
                onClick={() => void addSelectedFromLibrary()}
                className="flex-1 rounded-lg py-2 font-medium text-white disabled:opacity-40"
                style={{ backgroundColor: theme.primary }}
              >
                Add{selectedFromLibrary.size > 0 ? ` (${selectedFromLibrary.size})` : ""}
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
          isProfilePicture={isPhotoUsedAsProfile(modal)}
          onClose={() => {
            setModal(null);
            setDetailsEditing(false);
          }}
          onNameChange={setName}
          onDescChange={setDesc}
          onSaveDetails={async () => {
            await updatePhoto(modal.id, {
              name: name.trim() || undefined,
              description: desc.trim() || undefined,
            });
            setModal(null);
            setDetailsEditing(false);
            void load();
          }}
          onUseAsProfilePhoto={
            !isVideoDataUrl(modal.uri) ? useModalAsProfilePhoto : undefined
          }
          useAsProfilePhotoPending={profilePhotoBusy}
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
                  disabled={isModalPhotoAlbumCover || !modalCanBeCover}
                  aria-pressed={isModalPhotoAlbumCover}
                  title={
                    !modalCanBeCover
                      ? "Only still images can be album covers (not videos or GIFs)."
                      : undefined
                  }
                  aria-label={
                    !modalCanBeCover
                      ? "Cannot set as cover: videos and GIFs are not supported"
                      : isModalPhotoAlbumCover
                        ? "This media is the album cover"
                        : "Set as album cover"
                  }
                  onClick={async () => {
                    await setAlbumCover(albumId, modal.id);
                    setModal(null);
                    router.back();
                  }}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 text-xs font-medium disabled:opacity-100 sm:gap-1.5 sm:px-2 sm:text-sm"
                  style={
                    isModalPhotoAlbumCover
                      ? {
                          cursor: "default",
                          backgroundColor: theme.primary,
                          borderColor: theme.primary,
                          color: "#ffffff",
                        }
                      : !modalCanBeCover
                        ? {
                            borderColor: theme.border,
                            color: theme.textSecondary,
                            cursor: "not-allowed",
                            opacity: 0.75,
                          }
                        : { borderColor: theme.border, color: theme.text }
                  }
                >
                  {isModalPhotoAlbumCover ? (
                    <>
                      <Check className="size-3.5 shrink-0 sm:size-4" strokeWidth={2.5} aria-hidden />
                      <span className="truncate">Album cover</span>
                    </>
                  ) : (
                    <>
                      <Star className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                      <span className="truncate">Set as cover</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  title="Remove from album"
                  aria-label="Remove from album"
                  onClick={async () => {
                    await movePhotoToAlbum(modal.id, null);
                    setModal(null);
                    void load();
                  }}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 text-xs font-medium sm:gap-1.5 sm:px-2 sm:text-sm"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  <FolderMinus className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                  <span className="min-w-0 truncate">Remove from Album</span>
                </button>
              </div>
              <div className="flex min-w-0 flex-nowrap gap-1">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteFromLibraryOpen(true)}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-red-500 px-1 py-2 text-xs font-medium text-white sm:gap-1.5 sm:px-2 sm:text-sm"
                >
                  <Trash2 className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                  <span className="min-w-0 truncate">Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setDetailsEditing(false);
                  }}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border-2 px-1 py-2 text-xs font-medium sm:gap-1.5 sm:px-2 sm:text-sm"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  <X className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                  <span className="min-w-0 truncate">Close</span>
                </button>
              </div>
            </>
          }
        />
      )}

      <ConfirmDeleteMediaDialog
        theme={theme}
        open={confirmDeleteFromLibraryOpen && !!modal}
        photo={modal}
        titleId="confirm-delete-library-title"
        onCancel={() => setConfirmDeleteFromLibraryOpen(false)}
        onConfirm={() => void executeDeletePhotoFromLibrary()}
      />
    </div>
  );
}
