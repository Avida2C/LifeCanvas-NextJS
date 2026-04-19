"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DestructiveConfirmDialog } from "@/components/destructive-confirm-dialog";
import { isVideoDataUrl } from "@/lib/media-utils";
import { getPhotoDeleteImpact, type PhotoDeleteImpact } from "@/lib/storage";
import type { Theme } from "@/lib/theme";
import type { Photo } from "@/types";

function ImpactLines({
  theme,
  impact,
}: {
  theme: Theme;
  impact: PhotoDeleteImpact;
}) {
  const lines: { key: string; text: string }[] = [];
  if (impact.usedAsProfile) {
    lines.push({
      key: "profile",
      text: "Your profile picture will be cleared.",
    });
  }
  if (impact.noteEntriesAffected > 0) {
    const n = impact.noteEntriesAffected;
    lines.push({
      key: "notes",
      text: `It appears in ${n} note${n === 1 ? "" : "s"} — embedded images will be removed from those notes.`,
    });
  }
  if (impact.journalEntriesAffected > 0) {
    const n = impact.journalEntriesAffected;
    lines.push({
      key: "journals",
      text: `It appears in ${n} journal ${n === 1 ? "entry" : "entries"} — embedded images will be removed from those entries.`,
    });
  }
  if (impact.albumCoversAffected > 0) {
    const n = impact.albumCoversAffected;
    lines.push({
      key: "covers",
      text: `${n} album ${n === 1 ? "cover" : "covers"} use this image — those covers will update automatically.`,
    });
  }

  if (lines.length === 0) return null;

  return (
    <ul className="mt-3 list-disc space-y-1 pl-5" style={{ color: theme.text }}>
      {lines.map((l) => (
        <li key={l.key}>{l.text}</li>
      ))}
    </ul>
  );
}

export function ConfirmDeleteMediaDialog({
  theme,
  open,
  photo,
  titleId = "confirm-delete-media-title",
  onCancel,
  onConfirm,
}: {
  theme: Theme;
  open: boolean;
  photo: Photo | null;
  titleId?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [impact, setImpact] = useState<PhotoDeleteImpact | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !photo) {
      setImpact(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setImpact(null);
    setLoading(true);
    void getPhotoDeleteImpact(photo)
      .then((i) => {
        if (!cancelled) {
          setImpact(i);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImpact({
            usedAsProfile: false,
            noteEntriesAffected: 0,
            journalEntriesAffected: 0,
            albumCoversAffected: 0,
          });
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, photo]);

  const hasCrossRefs =
    impact &&
    (impact.usedAsProfile ||
      impact.noteEntriesAffected > 0 ||
      impact.journalEntriesAffected > 0 ||
      impact.albumCoversAffected > 0);

  const kind = photo && isVideoDataUrl(photo.uri) ? "video" : "photo";

  return (
    <DestructiveConfirmDialog
      theme={theme}
      open={open && !!photo}
      titleId={titleId}
      title="Delete from library?"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <>
        <p>
          This will permanently remove this {kind} from your library. This cannot
          be undone.
        </p>
        {loading ? (
          <p
            className="mt-3 flex items-center gap-2 text-sm"
            style={{ color: theme.textSecondary }}
          >
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Checking where it’s used…
          </p>
        ) : null}
        {!loading && impact ? (
          <>
            <ImpactLines theme={theme} impact={impact} />
            {hasCrossRefs ? (
              <p className="mt-3 text-xs font-semibold" style={{ color: theme.text }}>
                It will be removed everywhere it appears.
              </p>
            ) : null}
          </>
        ) : null}
      </>
    </DestructiveConfirmDialog>
  );
}
