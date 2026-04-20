"use client";

import { useParams } from "next/navigation";
import { TaskDetailView } from "@/components/views/task-detail-view";

export default function TaskViewPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return <TaskDetailView id={id} />;
}
