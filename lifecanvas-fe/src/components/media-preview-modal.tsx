"use client";

import type { ReactNode } from "react";
import { Loader2, User, X } from "lucide-react";
import type { Theme } from "@/lib/theme";
import { isVideoDataUrl } from "@/lib/media-utils";
import type { Photo } from "@/types";

function formatAddedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function MediaPreviewModal({
  theme,
  photo,
  name,
  desc,
  detailsVisible,
  onClose,
  onNameChange,
  onDescChange,
  onSaveDetails,
  actions,
  onUseAsProfilePhoto,
  useAsProfilePhotoPending,
  isProfilePicture,
}: {
  theme: Theme;
  photo: Photo;
  name: string;
  desc: string;
  /** When true, title and description fields are shown above Actions. */
  detailsVisible: boolean;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onDescChange: (value: string) => void;
  /** Shown only under Description when details are open. */
  onSaveDetails?: () => void | Promise<void>;
  actions: ReactNode;
  /** Still images only — set account avatar from this upload. */
  onUseAsProfilePhoto?: () => void | Promise<void>;
  useAsProfilePhotoPending?: boolean;
  /** This gallery item is the current account profile photo. */
  isProfilePicture?: boolean;
}) {
  const isVideo = isVideoDataUrl(photo.uri);

  return (
    <div
      className="fixed inset-0 z-80 flex flex-col justify-end bg-black/70 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-preview-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border-2 shadow-xl sm:max-h-[88vh] sm:rounded-2xl"
        style={{ backgroundColor: theme.card, borderColor: theme.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-2 border-b-2 px-4 py-3"
          style={{ borderColor: theme.border }}
        >
          <div className="min-w-0">
            <h2 id="media-preview-title" className="truncate text-base font-bold" style={{ color: theme.text }}>
              {photo.name?.trim() || (isVideo ? "Video" : "Photo")}
            </h2>
            <p className="truncate text-xs" style={{ color: theme.textSecondary }}>
              {isVideo ? "Video" : "Image"} · Added {formatAddedAt(photo.createdAt)}
            </p>
            {isProfilePicture && !isVideo ? (
              <p
                className="mt-1 flex items-center gap-1 truncate text-xs font-semibold"
                style={{ color: theme.primary }}
              >
                <User className="size-3.5 shrink-0" aria-hidden />
                Profile picture
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: theme.text }}
            aria-label="Close preview"
          >
            <X className="size-6" />
          </button>
        </div>

        <div
          className="flex min-h-[200px] shrink-0 items-center justify-center bg-zinc-950 px-3 py-4"
          style={{ maxHeight: "min(52dvh, 420px)" }}
        >
          {isVideo ? (
            <video
              src={photo.uri}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[min(52dvh,420px)] max-w-full object-contain"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photo.uri}
              alt=""
              className="max-h-[min(52dvh,420px)] max-w-full object-contain"
            />
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
          <div className="space-y-4">
            {detailsVisible ? (
              <section>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: theme.textSecondary }}
                >
                  Details
                </p>
                <label className="block">
                  <span className="mb-1 block text-xs" style={{ color: theme.textSecondary }}>
                    Title
                  </span>
                  <input
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Title (optional)"
                    className="w-full rounded-lg border-2 px-3 py-2.5 text-sm outline-none"
                    style={{
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.surface,
                    }}
                  />
                </label>
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs" style={{ color: theme.textSecondary }}>
                    Description
                  </span>
                  <textarea
                    value={desc}
                    onChange={(e) => onDescChange(e.target.value)}
                    placeholder="Notes or caption (optional)"
                    rows={3}
                    className="w-full resize-y rounded-lg border-2 px-3 py-2.5 text-sm outline-none"
                    style={{
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.surface,
                    }}
                  />
                </label>
                {onSaveDetails ? (
                  <button
                    type="button"
                    onClick={() => void onSaveDetails()}
                    className="mt-3 w-full rounded-lg py-2.5 text-sm font-semibold text-white"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Save changes
                  </button>
                ) : null}
              </section>
            ) : null}

            <section
              className="border-t pt-4"
              style={{ borderColor: theme.divider }}
            >
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-wide"
                style={{ color: theme.textSecondary }}
              >
                Actions
              </p>
              <div className="flex w-full flex-col gap-2 px-[0.2rem]">
                {!isVideo && onUseAsProfilePhoto && !isProfilePicture ? (
                  <button
                    type="button"
                    disabled={useAsProfilePhotoPending}
                    onClick={() => void onUseAsProfilePhoto()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold disabled:opacity-60"
                    style={{ borderColor: theme.primary, color: theme.primary }}
                  >
                    {useAsProfilePhotoPending ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    ) : (
                      <User className="size-4 shrink-0" aria-hidden />
                    )}
                    Use as profile photo
                  </button>
                ) : null}
                {actions}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
