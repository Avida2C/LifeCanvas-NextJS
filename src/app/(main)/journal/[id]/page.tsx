"use client";

import { useParams } from "next/navigation";
import { JournalDetailView } from "@/components/views/journal-detail-view";

/** Dynamic journal detail route (`/journal/:id`). */
export default function JournalViewPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return <JournalDetailView id={id} />;
}
