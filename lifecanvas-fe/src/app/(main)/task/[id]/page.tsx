"use client";

import { useParams } from "next/navigation";
import { TaskDetailView } from "@/components/views/task-detail-view";

/** Dynamic task-list detail route (`/task/:id`). */
export default function TaskViewPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return <TaskDetailView id={id} />;
}
