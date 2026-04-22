"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlbumDetailView } from "@/components/views/album-detail-view";

/** Param/search wrapper for album detail view. */
function AlbumPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const albumId = String(params.albumId ?? "");
  const albumName = searchParams.get("name") || "Album";
  return <AlbumDetailView albumId={albumId} albumName={albumName} />;
}

/** Dynamic album route (`/album/:albumId`) with suspense-safe param reads. */
export default function AlbumViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
      <AlbumPageInner />
    </Suspense>
  );
}
