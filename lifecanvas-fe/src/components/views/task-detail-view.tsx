"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DestructiveConfirmDialog } from "@/components/destructive-confirm-dialog";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/components/providers/theme-provider";
import { deleteTaskList, getTaskList, saveTaskList } from "@/lib/storage";
import type { TaskList } from "@/types";

export function TaskDetailView({ id }: { id: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [taskList, setTaskList] = useState<TaskList | null | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await getTaskList(id);
      if (!cancelled) setTaskList(loaded ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const orderedTasks = useMemo(() => {
    if (!taskList) return [];
    // Keep incomplete tasks at the top for quicker interaction.
    return [
      ...taskList.tasks.filter((t) => !t.done),
      ...taskList.tasks.filter((t) => t.done),
    ];
  }, [taskList]);

  const toggleTaskDone = async (taskId: number) => {
    if (!taskList) return;
    const updated: TaskList = {
      ...taskList,
      tasks: taskList.tasks.map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t,
      ),
    };
    // Optimistic update for responsive checkbox toggling.
    setTaskList(updated);
    await saveTaskList(updated);
  };

  if (taskList === undefined) {
    return <div className="p-6 text-sm">Loading…</div>;
  }

  if (!taskList) {
    return (
      <div className="p-6">
        <ScreenHeader title="Not found" theme={theme} />
        <p className="mt-4">Task list not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col" style={{ backgroundColor: theme.background }}>
      <ScreenHeader
        title="Task list"
        theme={theme}
        actions={[
          {
            icon: Pencil,
            label: "Edit",
            onClick: () => router.push(`/task-editor?id=${id}`),
          },
          {
            icon: Trash2,
            label: "Delete",
            onClick: () => setDeleteConfirmOpen(true),
          },
        ]}
      />

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="mb-3 pb-3">
          <h1 className="text-xl font-bold">
            {taskList.title?.trim() || `Task list #${taskList.id}`}
          </h1>
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            {taskList.tasks.length} task(s)
          </p>
        </div>

        <div
          className="rounded-2xl border-2 p-4"
          style={{ borderColor: theme.border, backgroundColor: theme.surface }}
        >
          {orderedTasks.length === 0 ? (
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              No tasks yet.
            </p>
          ) : (
            <div className="space-y-2">
              {orderedTasks.map((task) => (
                <label key={task.id} className="flex cursor-pointer items-start gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleTaskDone(task.id)}
                    className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-xs"
                    style={{
                      borderColor: task.done ? theme.primary : theme.border,
                      color: task.done ? "#fff" : theme.textSecondary,
                      backgroundColor: task.done ? theme.primary : "transparent",
                    }}
                    aria-label={task.done ? "Mark as not done" : "Mark as done"}
                  >
                    {task.done ? "✓" : ""}
                  </button>
                  <div className="min-w-0">
                    <p className={task.done ? "line-through opacity-60" : ""}>
                      {task.content || "Empty task"}
                    </p>
                    {task.deadline ? (
                      <p className="text-xs" style={{ color: theme.textSecondary }}>
                        Deadline: {new Date(`${task.deadline}T00:00:00`).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <DestructiveConfirmDialog
        theme={theme}
        open={deleteConfirmOpen}
        titleId="confirm-delete-task-list-title"
        title="Delete this task list?"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          await deleteTaskList(id);
          setDeleteConfirmOpen(false);
          router.back();
        }}
      >
        <p>
          The list &quot;{taskList.title?.trim() || `Task list #${taskList.id}`}&quot; and
          all of its tasks will be removed. This cannot be undone.
        </p>
      </DestructiveConfirmDialog>
    </div>
  );
}
