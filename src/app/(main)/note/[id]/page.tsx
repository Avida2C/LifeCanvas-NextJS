"use client";

import { useParams } from "next/navigation";
import { NoteDetailView } from "@/components/views/note-detail-view";

/** Dynamic note detail route (`/note/:id`). */
export default function NoteViewPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return <NoteDetailView id={id} />;
}
