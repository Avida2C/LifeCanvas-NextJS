"use client";

import { useParams } from "next/navigation";
import { NoteDetailView } from "@/components/views/note-detail-view";

export default function NoteViewPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return <NoteDetailView id={id} />;
}
